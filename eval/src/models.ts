/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { googleAI } from "@genkit-ai/google-genai";
import { openAI } from "@genkit-ai/compat-oai/openai";
import { claude35Haiku, claude4Sonnet } from "genkitx-anthropic";

export interface ModelConfiguration {
  model: any;
  name: string;
  config?: any;
}

export const modelsToTest: ModelConfiguration[] = [
  {
    model: openAI.model("gpt-5"),
    name: "gpt-5 (reasoning: minimal)",
    config: { reasoning_effort: "minimal" },
  },
  {
    model: openAI.model("gpt-5-mini"),
    name: "gpt-5-mini (reasoning: minimal)",
    config: { reasoning_effort: "minimal" },
  },
  {
    model: openAI.model("gpt-4.1"),
    name: "gpt-4.1",
    config: {},
  },
  {
    model: googleAI.model("gemini-2.5-pro"),
    name: "gemini-2.5-pro (thinking: 1000)",
    config: { thinkingConfig: { thinkingBudget: 1000 } },
  },
  {
    model: googleAI.model("gemini-2.5-flash"),
    name: "gemini-2.5-flash (thinking: 0)",
    config: { thinkingConfig: { thinkingBudget: 0 } },
  },
  {
    model: googleAI.model("gemini-2.5-flash-lite"),
    name: "gemini-2.5-flash-lite (thinking: 0)",
    config: { thinkingConfig: { thinkingBudget: 0 } },
  },
  {
    model: claude4Sonnet,
    name: "claude-4-sonnet",
    config: {},
  },
  {
    model: claude35Haiku,
    name: "claude-35-haiku",
    config: {},
  },
];
