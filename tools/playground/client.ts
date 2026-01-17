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

// Mixed content response: text explanation + A2UI messages
export interface MixedContentResponse {
    text: string;
    a2uiMessages: ServerToClientMessage[];
}

// Advanced A2UI Web Designer Prompt with Mixed Content Support
const DEFAULT_SYSTEM_PROMPT = `You are an expert UI designer and full-stack developer specializing in A2UI (Agent-to-UI).
Your goal is to build BEAUTIFUL, MODERN, and RESPONSIVE websites based on user requests.

RESPONSE FORMAT:
1.  **First**, provide a brief 1-3 sentence explanation of what you're building (plain text).
2.  **Then**, on separate lines, output the A2UI JSONL.
3.  The explanation should be conversational and helpful.

EXAMPLE RESPONSE:
I'll create a modern hero section with a bold headline, supporting text, and call-to-action buttons.

{"surfaceUpdate":{"components":[{"id":"root","component":{"Column":{"children":{"explicitList":["hero_title","hero_desc"]}}}}]}}
{"surfaceUpdate":{"components":[{"id":"hero_title","component":{"Heading":{"text":{"literalString":"Welcome"},"usageHint":"h1"}}}]}}
{"beginRendering":{"root":"root"}}

CORE PRINCIPLES:
1.  **Visual Hierarchy**: Use H1 for main titles, H2/H3 for sections. Use whitespace effectively.
2.  **Modern Layouts**:
    *   **Hero Section**: Centered high-impact Heading + Subtext + Call-to-Action Buttons.
    *   **Card Grids**: Use Rows of Columns containing Cards for features/products.
    *   **Navigation**: Top Row with Logo (Heading) and Links (Buttons).
    *   **Footer**: Bottom Column with copyright and secondary links.
3.  **Components**:
    *   Use **Card** for distinct content blocks.
    *   Use **Column** and **Row** for layout. Use "distribution" (spaceBetween, center) effectively.
    *   Use **Image** for visual appeal.
        *   For specific items (e.g., "flower", "pizza"), use: "https://loremflickr.com/600/400/keyword".
        *   For generic placeholders, use: "https://placehold.co/600x400?text=Description".
    *   Use **Button** for actions.

FORMAT RULES:
*   Output **JSONL** (JSON Lines). Each line must be a valid JSON object.
*   **DO NOT** include markdown code blocks (no \`\`\`json).
*   **Sequence**:
    1.  Send \`surfaceUpdate\` messages to define all components.
    2.  Send \`beginRendering\` message to show the root component.
*   **IDs**: Use descriptive IDs (e.g., "hero_section", "nav_bar", "feature_1").

When the user asks for a website, think about the structure first, explain briefly, then stream the components.`;

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
    private conversationHistory: {
        role: string;
        parts: {
            text?: string;
            inlineData?: { mimeType: string; data: string };
        }[];
    }[] = [];

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
     * Set a skill by applying its system prompt addendum
     * @param skillAddendum Additional instructions from the skill
     */
    setSkill(skillAddendum: string): void {
        this.systemPrompt = DEFAULT_SYSTEM_PROMPT + (skillAddendum ? '\n\n' + skillAddendum : '');
        this.clearHistory(); // Clear history when skill changes
        console.log("Skill applied. System prompt updated.");
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
     * @param message User text message
     * @param images Optional array of base64 image strings (clean base64, no data URI prefix)
     */
    async send(message: string, images: string[] = []): Promise<ServerToClientMessage[]> {
        // Construct the parts array
        const parts: { text?: string, inlineData?: { mimeType: string, data: string } }[] = [
            { text: message }
        ];

        // Add images if present
        for (const base64Image of images) {
            // Assume JPEG for simplicity if stripped, or we extract from data URI
            // Here we assume the frontend passes raw base64 data and we default to image/jpeg 
            // OR the frontend passes data URI and we parse it. 
            // Let's assume frontend passes data URI for convenience and we parse it here.

            let mimeType = "image/jpeg";
            let data = base64Image;

            if (base64Image.includes(";base64,")) {
                const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    mimeType = matches[1];
                    data = matches[2];
                }
            }

            parts.push({
                inlineData: {
                    mimeType,
                    data
                }
            });
        }

        // Add user message to history
        this.conversationHistory.push({
            role: "user",
            parts: parts,
        });

        try {
            const response = await this.genai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: this.conversationHistory,
                config: {
                    systemInstruction: this.systemPrompt,
                    temperature: 0.5,
                },
            });

            const responseText = response.text || "";

            // Add assistant response to history
            this.conversationHistory.push({
                role: "model",
                parts: [{ text: responseText }],
            });

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

    /**
     * Parse a response and extract both text explanation and A2UI messages
     */
    private parseMixedResponse(responseText: string): MixedContentResponse {
        console.log("=== parseMixedResponse input ===", responseText);

        // Remove markdown code blocks if present
        let cleanedText = responseText
            .replace(/```json\s*/gi, '')
            .replace(/```jsonl\s*/gi, '')
            .replace(/```\s*/g, '');

        // Split by newlines
        const lines = cleanedText
            .split("\n")
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const textLines: string[] = [];
        const a2uiMessages: ServerToClientMessage[] = [];

        for (const line of lines) {
            // Find JSON objects anywhere in the line
            const jsonStart = line.indexOf('{');

            if (jsonStart !== -1) {
                // Extract text before the JSON
                const textBefore = line.substring(0, jsonStart).trim();
                if (textBefore) {
                    textLines.push(textBefore);
                }

                // Extract the potential JSON part
                let jsonPart = line.substring(jsonStart);
                let parsed: unknown = null;

                try {
                    parsed = JSON.parse(jsonPart);
                } catch {
                    jsonPart = tryRepairJson(jsonPart);
                    try {
                        parsed = JSON.parse(jsonPart);
                        console.log("Repaired JSON successfully:", jsonPart.substring(0, 50) + "...");
                    } catch (e) {
                        // JSON-looking line that fails parsing - DON'T add to textLines
                        // This is most likely malformed A2UI that we should skip
                        console.warn("Failed to parse JSON line, skipping from text:", line.substring(0, 60) + "...");
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
                    a2uiMessages.push(parsed as ServerToClientMessage);
                    console.log("Parsed A2UI message:", (parsed as any).surfaceUpdate ? "surfaceUpdate" : (parsed as any).beginRendering ? "beginRendering" : "other");
                }
                // Don't add to textLines if it looked like JSON
            } else {
                // No JSON in this line, treat as text explanation
                textLines.push(line);
            }
        }

        const result = {
            text: textLines.join('\n').trim(),
            a2uiMessages
        };

        console.log("=== parseMixedResponse output ===", {
            text: result.text,
            a2uiMessagesCount: a2uiMessages.length
        });

        return result;
    }

    /**
     * Send a message and get mixed content response (text + A2UI)
     */
    async sendMixed(message: string, images: string[] = []): Promise<MixedContentResponse> {
        // Construct the parts array
        const parts: { text?: string, inlineData?: { mimeType: string, data: string } }[] = [
            { text: message }
        ];

        // Add images if present
        for (const base64Image of images) {
            let mimeType = "image/jpeg";
            let data = base64Image;

            if (base64Image.includes(";base64,")) {
                const matches = base64Image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                if (matches && matches.length === 3) {
                    mimeType = matches[1];
                    data = matches[2];
                }
            }

            parts.push({
                inlineData: {
                    mimeType,
                    data
                }
            });
        }

        // Add user message to history
        this.conversationHistory.push({
            role: "user",
            parts: parts,
        });

        try {
            const response = await this.genai.models.generateContent({
                model: "gemini-2.0-flash-exp",
                contents: this.conversationHistory,
                config: {
                    systemInstruction: this.systemPrompt,
                    temperature: 0.5,
                },
            });

            const responseText = response.text || "";

            // Add assistant response to history
            this.conversationHistory.push({
                role: "model",
                parts: [{ text: responseText }],
            });

            return this.parseMixedResponse(responseText);
        } catch (error) {
            console.error("Error generating A2UI response:", error);
            throw error;
        }
    }
}
