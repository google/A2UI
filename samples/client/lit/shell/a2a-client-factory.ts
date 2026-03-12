/*
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { A2AClient } from "@a2a-js/sdk/client";

const A2UI_EXTENSION_HEADER =
  "https://a2ui.org/a2a-extension/a2ui/v0.8";

export interface AgentCardRetryOptions {
  attempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  fetchImpl?: typeof fetch;
  clientFactory?: typeof A2AClient.fromCardUrl;
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_AGENT_CARD_RETRY_OPTIONS: Required<
  Pick<AgentCardRetryOptions, "attempts" | "initialDelayMs" | "maxDelayMs" | "backoffMultiplier">
> = {
  attempts: 8,
  initialDelayMs: 250,
  maxDelayMs: 2_000,
  backoffMultiplier: 2,
};

const sleep = async (ms: number) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

export const createA2UIFetch = (baseFetch: typeof fetch = fetch): typeof fetch => {
  return async (url, init) => {
    const headers = new Headers(init?.headers);
    headers.set("X-A2A-Extensions", A2UI_EXTENSION_HEADER);
    return baseFetch(url, { ...init, headers });
  };
};

export const isRetryableAgentCardError = (error: unknown) => {
  const message =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";

  return [
    "ECONNREFUSED",
    "fetch failed",
    "Failed to fetch",
    "NetworkError",
    "network error",
  ].some((needle) => message.includes(needle));
};

export const createA2AClientWithRetry = async (
  cardUrl: string,
  options: AgentCardRetryOptions = {}
) => {
  const {
    attempts = DEFAULT_AGENT_CARD_RETRY_OPTIONS.attempts,
    initialDelayMs = DEFAULT_AGENT_CARD_RETRY_OPTIONS.initialDelayMs,
    maxDelayMs = DEFAULT_AGENT_CARD_RETRY_OPTIONS.maxDelayMs,
    backoffMultiplier = DEFAULT_AGENT_CARD_RETRY_OPTIONS.backoffMultiplier,
    fetchImpl,
    clientFactory = A2AClient.fromCardUrl,
    sleep: sleepImpl = sleep,
  } = options;

  let delayMs = initialDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await clientFactory(cardUrl, {
        fetchImpl: fetchImpl ?? createA2UIFetch(),
      });
    } catch (error) {
      lastError = error;
      const shouldRetry = attempt < attempts && isRetryableAgentCardError(error);
      if (!shouldRetry) {
        throw error;
      }

      await sleepImpl(delayMs);
      delayMs = Math.min(maxDelayMs, Math.round(delayMs * backoffMultiplier));
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to connect to agent card: ${cardUrl}`);
};
