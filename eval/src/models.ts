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
