/*
 * API Server for Personalized Learning Demo
 *
 * Handles chat API requests using Gemini via VertexAI.
 * Also proxies A2A requests to Agent Engine.
 * Run with: npx tsx api-server.ts
 *
 * Required environment variables:
 *   GOOGLE_CLOUD_PROJECT - Your GCP project ID
 *   AGENT_ENGINE_PROJECT_NUMBER - Project number for Agent Engine
 *   AGENT_ENGINE_RESOURCE_ID - Resource ID of your deployed agent
 *
 * Optional environment variables:
 *   API_PORT - Server port (default: 8080)
 *   GOOGLE_CLOUD_LOCATION - GCP region (default: us-central1)
 *   GENAI_MODEL - Gemini model to use (default: gemini-2.5-flash)
 */

import { createServer } from "http";
import { execSync } from "child_process";
import { writeFileSync } from "fs";
import { config } from "dotenv";

// Load environment variables
config();

// =============================================================================
// MESSAGE LOG - Captures all request/response traffic for demo purposes
// =============================================================================
const LOG_FILE = "./demo-message-log.json";
let messageLog: Array<{
  sequence: number;
  timestamp: string;
  direction: "CLIENT_TO_SERVER" | "SERVER_TO_AGENT" | "AGENT_TO_SERVER" | "SERVER_TO_CLIENT";
  endpoint: string;
  data: unknown;
}> = [];
let sequenceCounter = 0;

function logMessage(
  direction: "CLIENT_TO_SERVER" | "SERVER_TO_AGENT" | "AGENT_TO_SERVER" | "SERVER_TO_CLIENT",
  endpoint: string,
  data: unknown
) {
  const entry = {
    sequence: ++sequenceCounter,
    timestamp: new Date().toISOString(),
    direction,
    endpoint,
    data,
  };
  messageLog.push(entry);

  // Write to file after each message for real-time viewing
  writeFileSync(LOG_FILE, JSON.stringify(messageLog, null, 2));
  console.log(`[LOG] #${entry.sequence} ${direction} → ${endpoint}`);
}

function resetLog() {
  messageLog = [];
  sequenceCounter = 0;
  writeFileSync(LOG_FILE, "[]");
  console.log(`[LOG] Reset log file: ${LOG_FILE}`);
}

// Reset log on server start
resetLog();

const PORT = parseInt(process.env.API_PORT || "8080");
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
const MODEL = process.env.GENAI_MODEL || "gemini-2.5-flash";

// Validate required environment variables
if (!PROJECT) {
  console.error("ERROR: GOOGLE_CLOUD_PROJECT environment variable is required");
  process.exit(1);
}

// Agent Engine Configuration - set via environment variables
// See QUICKSTART.md for deployment instructions
const AGENT_ENGINE_CONFIG = {
  projectNumber: process.env.AGENT_ENGINE_PROJECT_NUMBER || "",
  location: LOCATION,
  resourceId: process.env.AGENT_ENGINE_RESOURCE_ID || "",
};

if (!AGENT_ENGINE_CONFIG.projectNumber || !AGENT_ENGINE_CONFIG.resourceId) {
  console.warn("WARNING: AGENT_ENGINE_PROJECT_NUMBER and AGENT_ENGINE_RESOURCE_ID not set.");
  console.warn("         Agent Engine features will not work. See QUICKSTART.md for setup.");
}

// Dynamic import for google genai (ESM)
let genai: any = null;

async function initGenAI() {
  const { GoogleGenAI } = await import("@google/genai");
  // Use VertexAI with Application Default Credentials
  genai = new GoogleGenAI({
    vertexai: true,
    project: PROJECT,
    location: LOCATION,
  });
  console.log(`[API Server] Using VertexAI: ${PROJECT}/${LOCATION}`);
  console.log(`[API Server] Model: ${MODEL}`);
}

interface ChatMessage {
  role: string;
  parts: { text: string }[];
}

interface ChatRequest {
  systemPrompt: string;
  intentGuidance: string;
  messages: ChatMessage[];
  userMessage: string;
}

// Get Google Cloud access token
function getAccessToken(): string {
  try {
    const token = execSync("gcloud auth print-access-token", {
      encoding: "utf-8",
    }).trim();
    return token;
  } catch (error) {
    console.error("[API Server] Failed to get access token:", error);
    throw new Error("Failed to get Google Cloud access token. Run: gcloud auth login");
  }
}

// Query Agent Engine for A2UI content using streamQuery
async function queryAgentEngine(format: string, context: string = ""): Promise<any> {
  const { projectNumber, location, resourceId } = AGENT_ENGINE_CONFIG;
  // Use :streamQuery endpoint with stream_query method for ADK agents
  const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectNumber}/locations/${location}/reasoningEngines/${resourceId}:streamQuery`;

  const accessToken = getAccessToken();
  const message = context ? `Generate ${format} for: ${context}` : `Generate ${format}`;

  console.log(`[API Server] Querying Agent Engine: ${format}`);
  console.log(`[API Server] URL: ${url}`);

  // Build the request payload
  const requestPayload = {
    class_method: "stream_query",
    input: {
      user_id: "demo-user",
      message: message,
    },
  };

  // LOG: Server → Agent Engine request
  logMessage("SERVER_TO_AGENT", "Vertex AI Agent Engine (A2UI Generator)", {
    description: "Request to remote A2UI-generating agent",
    agentUrl: url,
    payload: requestPayload,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[API Server] Agent Engine error:", errorText);
    throw new Error(`Agent Engine error: ${response.status}`);
  }

  // Parse the newline-delimited JSON response
  const responseText = await response.text();
  console.log("[API Server] Agent Engine response length:", responseText.length);
  console.log("[API Server] Raw response (first 1000 chars):", responseText.substring(0, 1000));

  // LOG: Agent Engine → Server raw response
  logMessage("AGENT_TO_SERVER", "Vertex AI Agent Engine (raw)", {
    description: "Raw streaming response from Agent Engine (newline-delimited JSON)",
    responseLength: responseText.length,
    rawChunks: responseText.trim().split("\n").slice(0, 5).map(chunk => {
      try { return JSON.parse(chunk); } catch { return chunk.substring(0, 200); }
    }),
    note: "Showing first 5 chunks only",
  });

  // Extract text from all chunks
  const chunks = responseText.trim().split("\n").filter((line: string) => line.trim());
  let fullText = "";

  let functionResponseResult = "";  // Prioritize function_response over text
  let textParts = "";

  for (const chunk of chunks) {
    try {
      const parsed = JSON.parse(chunk);
      console.log("[API Server] Parsed chunk keys:", Object.keys(parsed));

      // Extract from content.parts - can contain text, function_call, or function_response
      if (parsed.content?.parts) {
        for (const part of parsed.content.parts) {
          // Check for function_response which contains the tool result (prioritize this)
          if (part.function_response?.response?.result) {
            const result = part.function_response.response.result;
            console.log("[API Server] Found function_response result:", result.substring(0, 200));
            functionResponseResult += result;
          } else if (part.text) {
            console.log("[API Server] Found text part:", part.text.substring(0, 100));
            textParts += part.text;
          }
        }
      }
    } catch (e) {
      console.warn("[API Server] Failed to parse chunk:", chunk.substring(0, 100));
    }
  }

  // Prefer function_response result over text parts (agent text often just wraps the same data)
  fullText = functionResponseResult || textParts;

  console.log("[API Server] Extracted text:", fullText.substring(0, 300));

  // Try to parse A2UI JSON from the response
  try {
    // Strip markdown code blocks if present
    let cleaned = fullText.trim();
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');
    cleaned = cleaned.trim();

    console.log("[API Server] Cleaned text:", cleaned.substring(0, 200));

    // Helper to extract A2UI content and source info from various formats
    const extractA2UIWithSource = (text: string): { a2ui: unknown[] | null; source?: { url: string; title: string; provider: string } } => {
      // Try parsing as raw JSON array (legacy format)
      if (text.startsWith("[")) {
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) return { a2ui: parsed };
        } catch {}
      }

      // Try parsing as object with a2ui and source (new format)
      if (text.startsWith("{")) {
        try {
          const wrapper = JSON.parse(text);
          // New format: {a2ui: [...], source: {...}}
          if (wrapper.a2ui && Array.isArray(wrapper.a2ui)) {
            return { a2ui: wrapper.a2ui, source: wrapper.source || undefined };
          }
          // Legacy format: {"result": "..."}
          if (wrapper.result) {
            const inner = typeof wrapper.result === 'string'
              ? JSON.parse(wrapper.result)
              : wrapper.result;
            // Check if inner is the new format
            if (inner && inner.a2ui && Array.isArray(inner.a2ui)) {
              return { a2ui: inner.a2ui, source: inner.source || undefined };
            }
            if (Array.isArray(inner)) return { a2ui: inner };
          }
        } catch {}
      }

      // Try to find and extract JSON array from text
      const arrayMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (arrayMatch) {
        try {
          const parsed = JSON.parse(arrayMatch[0]);
          if (Array.isArray(parsed)) return { a2ui: parsed };
        } catch {}
      }

      // Try to extract result field with regex and parse its content
      const resultMatch = text.match(/"result"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (resultMatch) {
        try {
          // Unescape the JSON string
          const unescaped = resultMatch[1]
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, '\\');
          const parsed = JSON.parse(unescaped);
          // Check if parsed is new format
          if (parsed && parsed.a2ui && Array.isArray(parsed.a2ui)) {
            return { a2ui: parsed.a2ui, source: parsed.source || undefined };
          }
          if (Array.isArray(parsed)) return { a2ui: parsed };
        } catch {}
      }

      return { a2ui: null };
    };

    const extracted = extractA2UIWithSource(cleaned);
    if (extracted.a2ui) {
      const result = {
        format,
        surfaceId: "learningContent",
        a2ui: extracted.a2ui,
        source: extracted.source,
      };

      // LOG: Parsed A2UI content
      logMessage("AGENT_TO_SERVER", "Vertex AI Agent Engine (parsed A2UI)", {
        description: "Successfully parsed A2UI JSON from agent response",
        format,
        surfaceId: "learningContent",
        source: extracted.source,
        a2uiMessageCount: extracted.a2ui.length,
        a2uiMessages: extracted.a2ui,
      });

      return result;
    }

    // Return raw text if no JSON found
    return {
      format,
      surfaceId: "learningContent",
      a2ui: [],
      rawText: fullText,
    };
  } catch (e) {
    console.error("[API Server] Failed to parse agent response:", e);
    return {
      format,
      surfaceId: "learningContent",
      a2ui: [],
      rawText: fullText,
      error: "Failed to parse A2UI JSON",
    };
  }
}

/**
 * Generate QuizCard content locally using Gemini.
 * This is used when Agent Engine doesn't have QuizCard support.
 */
async function generateLocalQuiz(topic: string): Promise<any> {
  const systemPrompt = `You are creating MCAT practice quiz questions for Maria, a pre-med student who loves sports/gym analogies.

Create 2 interactive quiz questions about "${topic || 'ATP and bond energy'}" that:
1. Test understanding with MCAT-style questions
2. Include plausible wrong answers reflecting common misconceptions
3. Provide detailed explanations using sports/gym analogies
4. Use precise scientific language

Output ONLY valid JSON in this EXACT format (no markdown, no explanation):

[
  {"beginRendering": {"surfaceId": "learningContent", "root": "mainColumn"}},
  {
    "surfaceUpdate": {
      "surfaceId": "learningContent",
      "components": [
        {
          "id": "mainColumn",
          "component": {
            "Column": {
              "children": {"explicitList": ["headerText", "quizRow"]},
              "distribution": "start",
              "alignment": "stretch"
            }
          }
        },
        {
          "id": "headerText",
          "component": {
            "Text": {
              "text": {"literalString": "Quick Quiz: [TOPIC]"},
              "usageHint": "h3"
            }
          }
        },
        {
          "id": "quizRow",
          "component": {
            "Row": {
              "children": {"explicitList": ["quiz1", "quiz2"]},
              "distribution": "start",
              "alignment": "stretch"
            }
          }
        },
        {
          "id": "quiz1",
          "component": {
            "QuizCard": {
              "question": {"literalString": "[QUESTION 1]"},
              "options": [
                {"label": {"literalString": "[OPTION A]"}, "value": "a", "isCorrect": false},
                {"label": {"literalString": "[OPTION B - CORRECT]"}, "value": "b", "isCorrect": true},
                {"label": {"literalString": "[OPTION C]"}, "value": "c", "isCorrect": false},
                {"label": {"literalString": "[OPTION D]"}, "value": "d", "isCorrect": false}
              ],
              "explanation": {"literalString": "[DETAILED EXPLANATION WITH ANALOGY]"},
              "category": {"literalString": "[CATEGORY]"}
            }
          }
        },
        {
          "id": "quiz2",
          "component": {
            "QuizCard": {
              "question": {"literalString": "[QUESTION 2]"},
              "options": [
                {"label": {"literalString": "[OPTION A]"}, "value": "a", "isCorrect": false},
                {"label": {"literalString": "[OPTION B]"}, "value": "b", "isCorrect": false},
                {"label": {"literalString": "[OPTION C - CORRECT]"}, "value": "c", "isCorrect": true},
                {"label": {"literalString": "[OPTION D]"}, "value": "d", "isCorrect": false}
              ],
              "explanation": {"literalString": "[DETAILED EXPLANATION WITH ANALOGY]"},
              "category": {"literalString": "[CATEGORY]"}
            }
          }
        }
      ]
    }
  }
]

Replace all [BRACKETED] placeholders with actual content. Vary which option is correct.`;

  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: `Generate quiz questions about: ${topic || 'ATP and bond energy'}` }] }],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
      },
    });

    const text = response.text?.trim() || "";
    console.log("[API Server] Local quiz generation response:", text.substring(0, 500));

    // Parse the JSON
    let cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    let parsed = JSON.parse(cleaned);

    // Handle case where Gemini wraps the A2UI array in an object
    // We only want the A2UI messages array, not any wrapper object
    let a2ui: unknown[];
    if (Array.isArray(parsed)) {
      a2ui = parsed;
    } else if (parsed.a2ui && Array.isArray(parsed.a2ui)) {
      a2ui = parsed.a2ui;
    } else if (parsed.messages && Array.isArray(parsed.messages)) {
      a2ui = parsed.messages;
    } else {
      console.error("[API Server] Unexpected quiz format from Gemini:", Object.keys(parsed));
      return null;
    }

    // Always use OpenStax source - ignore any source from Gemini
    return {
      format: "quiz",
      surfaceId: "learningContent",
      a2ui: a2ui,
      source: {
        provider: "OpenStax Biology for AP Courses",
        title: "Chapter 6: Metabolism",
        url: "https://openstax.org/books/biology-ap-courses/pages/6-introduction",
      },
    };
  } catch (error) {
    console.error("[API Server] Local quiz generation failed:", error);
    return null;
  }
}

async function handleChatRequest(request: ChatRequest): Promise<{ text: string }> {
  const { systemPrompt, intentGuidance, messages, userMessage } = request;

  // Build the full system instruction
  const fullSystemPrompt = `${systemPrompt}\n\n${intentGuidance}`;

  // Convert messages to Gemini format
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: m.parts,
  }));

  // Add the current user message
  contents.push({
    role: "user",
    parts: [{ text: userMessage }],
  });

  try {
    const response = await genai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: fullSystemPrompt,
      },
    });

    const text = response.text || "I apologize, I couldn't generate a response.";
    return { text };
  } catch (error) {
    console.error("[API Server] Error calling Gemini:", error);
    throw error;
  }
}

function parseBody(req: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk: string) => {
      body += chunk;
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

async function main() {
  console.log("[API Server] Initializing Gemini client...");
  await initGenAI();

  const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Health check
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy" }));
      return;
    }

    // Reset message log (useful before demo)
    if (req.url === "/reset-log" && req.method === "POST") {
      resetLog();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "log reset", file: LOG_FILE }));
      return;
    }

    // View current log
    if (req.url === "/log" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(messageLog, null, 2));
      return;
    }

    // A2A Agent Engine endpoint
    if (req.url === "/a2ui-agent/a2a/query" && req.method === "POST") {
      try {
        const body = await parseBody(req);
        console.log("[API Server] A2A query received:", body.message);

        // LOG: Client → Server request for A2UI content
        logMessage("CLIENT_TO_SERVER", "/a2ui-agent/a2a/query", {
          description: "Browser client requesting A2UI content generation",
          requestBody: body,
        });

        // Parse format from message (e.g., "flashcards:context" or just "flashcards")
        const parts = (body.message || "flashcards").split(":");
        const format = parts[0].trim();
        const context = parts.slice(1).join(":").trim();

        let result = await queryAgentEngine(format, context);

        // If quiz was requested but Agent Engine returned Flashcards or empty,
        // generate quiz locally using Gemini
        if (format.toLowerCase() === "quiz") {
          const a2uiStr = JSON.stringify(result.a2ui || []);
          const hasFlashcards = a2uiStr.includes("Flashcard");
          const hasQuizCards = a2uiStr.includes("QuizCard");
          const isEmpty = !result.a2ui || result.a2ui.length === 0;

          if (isEmpty || (hasFlashcards && !hasQuizCards)) {
            console.log("[API Server] Agent Engine doesn't support QuizCard, generating locally");
            const localQuiz = await generateLocalQuiz(context);
            if (localQuiz) {
              result = localQuiz;
            }
          }
        }

        // LOG: Server → Client response with A2UI
        logMessage("SERVER_TO_CLIENT", "/a2ui-agent/a2a/query", {
          description: "Sending A2UI JSON payload to browser for rendering",
          format: result.format,
          surfaceId: result.surfaceId,
          source: result.source,
          a2uiMessageCount: result.a2ui?.length || 0,
          a2uiPayload: result.a2ui,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error: any) {
        console.error("[API Server] A2A error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // Chat endpoint
    if (req.url === "/api/chat" && req.method === "POST") {
      try {
        const body = await parseBody(req);
        console.log("[API Server] Chat request received");

        // LOG: Client → Server chat request
        logMessage("CLIENT_TO_SERVER", "/api/chat", {
          description: "Browser client sending chat message to Gemini",
          userMessage: body.userMessage,
          intentGuidance: body.intentGuidance?.substring(0, 100) + "...",
          conversationLength: body.messages?.length || 0,
        });

        const result = await handleChatRequest(body);

        // LOG: Server → Client chat response
        logMessage("SERVER_TO_CLIENT", "/api/chat", {
          description: "Gemini response text (conversational layer)",
          responseText: result.text,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      } catch (error: any) {
        console.error("[API Server] Error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
      return;
    }

    // 404 for other routes
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  });

  server.listen(PORT, () => {
    console.log(`[API Server] Running on http://localhost:${PORT}`);
    console.log(`[API Server] Chat endpoint: POST http://localhost:${PORT}/api/chat`);
    console.log(`\n📋 MESSAGE LOG ENABLED`);
    console.log(`   Log file: ${LOG_FILE}`);
    console.log(`   View log: GET http://localhost:${PORT}/log`);
    console.log(`   Reset log: POST http://localhost:${PORT}/reset-log`);
    console.log(`\n   After running the demo, check ${LOG_FILE} for the full message sequence!\n`);
  });
}

main().catch(console.error);
