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

import type { Plugin, Connect } from "vite";
import type { IncomingMessage } from "http";
import { v4 as uuidv4 } from "uuid";
import { A2AClient } from "@a2a-js/sdk/client";
import {
  MessageSendParams,
  Part,
  SendMessageSuccessResponse,
  Task,
} from "@a2a-js/sdk";

const A2AUI_EXTENSION_URL = "https://a2ui.org/a2a-extension/a2ui/v0.8";
const A2AUI_MIME_TYPE = "application/json+a2aui";

/**
 * Configuration options for the A2A middleware plugin.
 */
export interface A2AMiddlewareOptions {
  /**
   * Default port for the A2A agent.
   * Can be overridden by the A2A_AGENT_PORT environment variable.
   * @default "10002"
   */
  defaultPort?: string;

  /**
   * Default host for the A2A agent.
   * Can be overridden by the A2A_AGENT_HOST environment variable.
   * @default "localhost"
   */
  defaultHost?: string;

  /**
   * The endpoint path for the A2A proxy.
   * @default "/a2a"
   */
  endpoint?: string;

  /**
   * List of supported A2UI catalog URIs.
   * These are sent to the agent to indicate which UI components the client supports.
   */
  supportedCatalogIds?: string[];
}

/**
 * Custom fetch that adds the A2A-Extensions header for A2UI support.
 */
const createFetchWithExtension = () => {
  return async (url: string | URL | Request, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set("X-A2A-Extensions", A2AUI_EXTENSION_URL);
    return fetch(url, { ...init, headers });
  };
};

/**
 * Checks if a string is valid JSON object.
 */
const isJsonObject = (str: string): boolean => {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
  } catch {
    return false;
  }
};

/**
 * Creates the message parameters for an A2A request.
 */
const createMessageParams = (body: string, supportedCatalogIds?: string[]): MessageSendParams => {
  const messageId = uuidv4();

  const metadata = supportedCatalogIds?.length
    ? {
        a2uiClientCapabilities: {
          supportedCatalogIds,
        },
      }
    : undefined;

  if (isJsonObject(body)) {
    console.log("[a2a-middleware] Received JSON UI event:", body);
    return {
      message: {
        messageId,
        role: "user",
        parts: [
          {
            kind: "data",
            data: JSON.parse(body),
            metadata: { mimeType: A2AUI_MIME_TYPE },
          } as Part,
        ],
        kind: "message",
        metadata,
      },
    };
  }

  console.log("[a2a-middleware] Received text query:", body);
  return {
    message: {
      messageId,
      role: "user",
      parts: [{ kind: "text", text: body }],
      kind: "message",
      metadata,
    },
  };
};

/**
 * Creates a Vite plugin that proxies requests to an A2A agent.
 *
 * This plugin intercepts POST requests to the configured endpoint (default: /a2a)
 * and forwards them to the A2A agent, handling both text queries and JSON UI events.
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { a2aMiddleware } from "@a2ui/vite-plugin-a2a";
 *
 * export default defineConfig({
 *   plugins: [
 *     react(),
 *     a2aMiddleware({ defaultPort: "10003" })
 *   ],
 * });
 * ```
 */
export const a2aMiddleware = (options: A2AMiddlewareOptions = {}): Plugin => {
  const {
    defaultPort = "10002",
    defaultHost = "localhost",
    endpoint = "/a2a",
    supportedCatalogIds,
  } = options;

  let client: A2AClient | null = null;

  const getAgentCardUrl = (): string => {
    const port = process.env.A2A_AGENT_PORT || defaultPort;
    const host = process.env.A2A_AGENT_HOST || defaultHost;
    return `http://${host}:${port}/.well-known/agent-card.json`;
  };

  const getOrCreateClient = async (): Promise<A2AClient> => {
    if (!client) {
      const agentCardUrl = getAgentCardUrl();
      console.log(`[a2a-middleware] Connecting to agent at ${agentCardUrl}`);
      client = await A2AClient.fromCardUrl(agentCardUrl, {
        fetchImpl: createFetchWithExtension(),
      });
    }
    return client;
  };

  return {
    name: "vite-plugin-a2a",
    configureServer(server) {
      server.middlewares.use(
        `${endpoint}/agent-card`,
        (async (
          req: IncomingMessage,
          res: {
            setHeader: (name: string, value: string) => void;
            statusCode: number;
            end: (data?: string) => void;
          },
          next: Connect.NextFunction
        ) => {
          if (req.method !== "GET") {
            next();
            return;
          }

          try {
            const a2aClient = await getOrCreateClient();
            const agentCard = await a2aClient.getAgentCard();

            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(agentCard));
          } catch (err) {
            console.error("[a2a-middleware] Error fetching agent card:", err);
            res.statusCode = 500;
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : "Unknown error",
              })
            );
          }
        }) as Connect.NextHandleFunction
      );

      server.middlewares.use(
        endpoint,
        (async (
          req: IncomingMessage,
          res: {
            setHeader: (name: string, value: string) => void;
            statusCode: number;
            end: (data?: string) => void;
          },
          next: Connect.NextFunction
        ) => {
          if (req.method !== "POST") {
            next();
            return;
          }

          let body = "";

          req.on("data", (chunk: Buffer) => {
            body += chunk.toString();
          });

          req.on("end", async () => {
            try {
              const a2aClient = await getOrCreateClient();
              const sendParams = createMessageParams(body, supportedCatalogIds);
              const response = await a2aClient.sendMessage(sendParams);

              res.setHeader("Cache-Control", "no-store");
              res.setHeader("Content-Type", "application/json");

              if ("error" in response) {
                console.error("[a2a-middleware] Error:", response.error.message);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: response.error.message }));
                return;
              }

              const result = (response as SendMessageSuccessResponse).result as Task;

              // Collect parts from multiple sources:
              // 1. From status.message.parts (standard response location)
              // 2. From artifacts (where A2UI tool outputs go)
              const allParts: Part[] = [];

              if (result.kind === "task") {
                // Add parts from status message if present
                if (result.status.message?.parts) {
                  allParts.push(...result.status.message.parts);
                }

                // Add parts from artifacts (A2UI data is often here)
                if (result.artifacts) {
                  for (const artifact of result.artifacts) {
                    if (artifact.parts) {
                      allParts.push(...artifact.parts);
                    }
                  }
                }
              }

              res.end(JSON.stringify(allParts));
            } catch (err) {
              console.error("[a2a-middleware] Error:", err);
              res.statusCode = 500;
              res.end(
                JSON.stringify({
                  error: err instanceof Error ? err.message : "Unknown error",
                })
              );
            }
          });

          req.on("error", (err: Error) => {
            console.error("[a2a-middleware] Request error:", err);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });
        }) as Connect.NextHandleFunction
      );
    },
  };
};
