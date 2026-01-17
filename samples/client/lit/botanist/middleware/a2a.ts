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

import { IncomingMessage, ServerResponse } from "http";
import { Plugin, ViteDevServer } from "vite";
import { A2AClient } from "@a2a-js/sdk/client";
import {
    MessageSendParams,
    Part,
    SendMessageSuccessResponse,
    Task,
} from "@a2a-js/sdk";
import { v4 as uuidv4 } from "uuid";

const A2UI_MIME_TYPE = "application/json+a2ui";

// Digital Botanist agent URL
const AGENT_CARD_URL = "http://localhost:10004/.well-known/agent-card.json";

const fetchWithCustomHeader: typeof fetch = async (url, init) => {
    const headers = new Headers(init?.headers);
    headers.set("X-A2A-Extensions", "https://a2ui.org/a2a-extension/a2ui/v0.8");

    const newInit = { ...init, headers };
    return fetch(url, newInit);
};

const isJson = (str: string) => {
    try {
        const parsed = JSON.parse(str);
        return (
            typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        );
    } catch (err) {
        console.warn(err);
        return false;
    }
};

let client: A2AClient | null = null;
const createOrGetClient = async () => {
    if (!client) {
        // Create a client pointing to the Digital Botanist agent.
        client = await A2AClient.fromCardUrl(AGENT_CARD_URL, {
            fetchImpl: fetchWithCustomHeader,
        });
    }

    return client;
};

export const plugin = (): Plugin => {
    return {
        name: "a2a-handler",
        configureServer(server: ViteDevServer) {
            server.middlewares.use(
                "/a2a",
                async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
                    if (req.method === "POST") {
                        let originalBody = "";

                        req.on("data", (chunk) => {
                            originalBody += chunk.toString();
                        });

                        req.on("end", async () => {
                            let sendParams: MessageSendParams;

                            if (isJson(originalBody)) {
                                console.log(
                                    "[botanist-middleware] Received JSON UI event:",
                                    originalBody
                                );

                                const clientEvent = JSON.parse(originalBody);
                                sendParams = {
                                    message: {
                                        messageId: uuidv4(),
                                        role: "user",
                                        parts: [
                                            {
                                                kind: "data",
                                                data: clientEvent,
                                                metadata: { mimeType: A2UI_MIME_TYPE },
                                            } as Part,
                                        ],
                                        kind: "message",
                                    },
                                };
                            } else {
                                console.log(
                                    "[botanist-middleware] Received text query:",
                                    originalBody
                                );
                                sendParams = {
                                    message: {
                                        messageId: uuidv4(),
                                        role: "user",
                                        parts: [
                                            {
                                                kind: "text",
                                                text: originalBody,
                                            },
                                        ],
                                        kind: "message",
                                    },
                                };
                            }

                            try {
                                const client = await createOrGetClient();
                                const response = await client.sendMessage(sendParams);
                                if ("error" in response) {
                                    console.error("Error:", response.error.message);
                                    res.statusCode = 500;
                                    res.setHeader("Content-Type", "application/json");
                                    res.end(JSON.stringify({ error: response.error.message }));
                                    return;
                                } else {
                                    const result = (response as SendMessageSuccessResponse)
                                        .result as Task;
                                    if (result.kind === "task") {
                                        res.statusCode = 200;
                                        res.setHeader("Content-Type", "application/json");
                                        res.end(JSON.stringify(result.status.message?.parts));
                                        return;
                                    }
                                }

                                res.statusCode = 200;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify([]));
                            } catch (err) {
                                console.error("[botanist-middleware] Error:", err);
                                res.statusCode = 500;
                                res.setHeader("Content-Type", "application/json");
                                res.end(JSON.stringify({ error: String(err) }));
                            }
                        });

                        return;
                    } else {
                        next();
                    }
                }
            );
        },
    };
};
