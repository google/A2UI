/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { GoogleGenAI } from "@google/genai";

// Type definitions for A2UI messages (subset)
export interface A2UIComponent {
    id: string;
    component: Record<string, unknown>;
}

export interface SurfaceUpdate {
    surfaceId?: string;
    components: A2UIComponent[];
}

export interface DataModelUpdate {
    surfaceId?: string;
    path?: string;
    contents: unknown[];
}

export interface BeginRendering {
    surfaceId?: string;
    root: string;
    catalogId?: string;
}

export interface DeleteSurface {
    surfaceId?: string;
    delete: boolean;
}

export interface ServerToClientMessage {
    surfaceUpdate?: SurfaceUpdate;
    dataModelUpdate?: DataModelUpdate;
    beginRendering?: BeginRendering;
    deleteSurface?: DeleteSurface;
}

// Default system prompt for A2UI generation - more explicit about JSON format
const DEFAULT_SYSTEM_PROMPT = `You are an AI that generates A2UI protocol responses. Each response is JSONL (JSON Lines format).

CRITICAL: Each line must be VALID, PARSEABLE JSON. Check your brackets carefully!

Response structure - EACH LINE is a separate JSON object:
1. Define components using surfaceUpdate
2. Provide data using dataModelUpdate
3. End with beginRendering

SIMPLE EXAMPLE (each line is one JSON object):
{"surfaceUpdate":{"components":[{"id":"root","component":{"Column":{"children":{"explicitList":["heading","text"]}}}}]}}
{"surfaceUpdate":{"components":[{"id":"heading","component":{"Heading":{"text":{"literalString":"Welcome"}}}}]}}
{"surfaceUpdate":{"components":[{"id":"text","component":{"Text":{"text":{"literalString":"This is a demo"}}}}]}}
{"dataModelUpdate":{"contents":[]}}
{"beginRendering":{"root":"root"}}

CARD WITH CONTENT EXAMPLE:
{"surfaceUpdate":{"components":[{"id":"root","component":{"Column":{"children":{"explicitList":["card1"]}}}}]}}
{"surfaceUpdate":{"components":[{"id":"card1","component":{"Card":{"child":"cardContent"}}}]}}
{"surfaceUpdate":{"components":[{"id":"cardContent","component":{"Column":{"children":{"explicitList":["title","desc"]}}}}]}}
{"surfaceUpdate":{"components":[{"id":"title","component":{"Heading":{"text":{"literalString":"Card Title"}}}}]}}
{"surfaceUpdate":{"components":[{"id":"desc","component":{"Text":{"text":{"literalString":"Card description"}}}}]}}
{"dataModelUpdate":{"contents":[]}}
{"beginRendering":{"root":"root"}}

Use components: Text, Heading, Image, Button, Card, Row, Column. Each child reference is a string ID.
For Image: use "url":{"literalString":"https://..."} 
For text: use "text":{"literalString":"..."}

DO NOT include markdown code blocks. ONLY output JSONL lines.`;

declare const process: { env: { GEMINI_API_KEY?: string } };

/**
 * Try to repair malformed JSON by balancing brackets
 */
function tryRepairJson(line: string): string {
    let repaired = line.trim();

    // Count brackets
    let openBraces = 0;
    let closeBraces = 0;
    let openBrackets = 0;
    let closeBrackets = 0;

    for (const char of repaired) {
        if (char === '{') openBraces++;
        if (char === '}') closeBraces++;
        if (char === '[') openBrackets++;
        if (char === ']') closeBrackets++;
    }

    // Remove excess closing braces
    while (closeBraces > openBraces && repaired.endsWith('}')) {
        repaired = repaired.slice(0, -1);
        closeBraces--;
    }

    // Remove excess closing brackets
    while (closeBrackets > openBrackets && repaired.endsWith(']')) {
        repaired = repaired.slice(0, -1);
        closeBrackets--;
    }

    // Add missing closing braces
    while (openBraces > closeBraces) {
        repaired += '}';
        closeBraces++;
    }

    // Add missing closing brackets
    while (openBrackets > closeBrackets) {
        repaired += ']';
        closeBrackets++;
    }

    return repaired;
}

/**
 * Client for communicating with Gemini API to generate A2UI responses
 */
export class A2UIClient {
    private genai: GoogleGenAI;
    private systemPrompt: string;
    private conversationHistory: { role: string; parts: { text: string }[] }[] = [];

    constructor(
        apiKey: string = process.env.GEMINI_API_KEY || "",
        systemPrompt: string = DEFAULT_SYSTEM_PROMPT
    ) {
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is required");
        }
        this.genai = new GoogleGenAI({ apiKey });
        this.systemPrompt = systemPrompt;
    }

    /**
     * Update the system prompt
     */
    setSystemPrompt(prompt: string): void {
        this.systemPrompt = prompt;
    }

    /**
     * Get the current system prompt
     */
    getSystemPrompt(): string {
        return this.systemPrompt;
    }

    /**
     * Clear conversation history
     */
    clearHistory(): void {
        this.conversationHistory = [];
    }

    /**
     * Send a message and get A2UI response
     */
    async send(message: string | object): Promise<ServerToClientMessage[]> {
        const userMessage =
            typeof message === "string" ? message : JSON.stringify(message);

        // Add user message to history
        this.conversationHistory.push({
            role: "user",
            parts: [{ text: userMessage }],
        });

        try {
            const response = await this.genai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: this.conversationHistory,
                config: {
                    systemInstruction: this.systemPrompt,
                    temperature: 0.5, // Lower temperature for more consistent JSON
                },
            });

            const responseText = response.text || "";

            // Add assistant response to history
            this.conversationHistory.push({
                role: "model",
                parts: [{ text: responseText }],
            });

            // Parse JSONL response into A2UI messages
            return this.parseA2UIResponse(responseText);
        } catch (error) {
            console.error("Error generating A2UI response:", error);
            throw error;
        }
    }

    /**
     * Parse a JSONL response into A2UI messages
     */
    private parseA2UIResponse(responseText: string): ServerToClientMessage[] {
        const messages: ServerToClientMessage[] = [];

        // Remove markdown code blocks if present
        let cleanedText = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```jsonl\s*/gi, '')
            .replace(/```\s*/g, '');

        // Split by newlines and filter empty lines
        const lines = cleanedText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        for (const line of lines) {
            // Skip lines that don't look like JSON
            if (!line.startsWith("{")) {
                continue;
            }

            // Try to parse the line
            let jsonLine = line;
            let parsed: unknown = null;

            // First try direct parse
            try {
                parsed = JSON.parse(jsonLine);
            } catch {
                // Try to repair and parse again
                jsonLine = tryRepairJson(line);
                try {
                    parsed = JSON.parse(jsonLine);
                    console.log("Repaired JSON:", jsonLine);
                } catch {
                    console.warn("Failed to parse A2UI message after repair:", line);
                    continue;
                }
            }

            // Validate it's a valid A2UI message
            if (
                parsed &&
                typeof parsed === "object" &&
                (("surfaceUpdate" in parsed) ||
                    ("dataModelUpdate" in parsed) ||
                    ("beginRendering" in parsed) ||
                    ("deleteSurface" in parsed))
            ) {
                messages.push(parsed as ServerToClientMessage);
            }
        }

        // If no valid messages were parsed, create a fallback text response
        if (messages.length === 0) {
            messages.push({
                surfaceUpdate: {
                    components: [
                        {
                            id: "root",
                            component: {
                                Column: {
                                    children: { explicitList: ["response_text"] },
                                },
                            },
                        },
                        {
                            id: "response_text",
                            component: {
                                Text: {
                                    text: { literalString: responseText.substring(0, 500) },
                                },
                            },
                        },
                    ],
                },
            });

            messages.push({
                dataModelUpdate: { contents: [] },
            });

            messages.push({
                beginRendering: { root: "root" },
            });
        }

        return messages;
    }
}
