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
import { genkit, z } from "genkit";
import { openAI } from "@genkit-ai/compat-oai/openai";
import { anthropic } from "genkitx-anthropic";

const plugins = [];

if (process.env.GEMINI_API_KEY) {
  console.log("Initializing Google AI plugin...");
  plugins.push(
    googleAI({
      apiKey: process.env.GEMINI_API_KEY!,
      experimental_debugTraces: true,
    })
  );
}
if (process.env.OPENAI_API_KEY) {
  console.log("Initializing OpenAI plugin...");
  plugins.push(openAI());
}
if (process.env.ANTHROPIC_API_KEY) {
  console.log("Initializing Anthropic plugin...");
  plugins.push(anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }));
}

export const ai = genkit({
  plugins,
});

// Define a UI component generator flow
export const componentGeneratorFlow = ai.defineFlow(
  {
    name: "componentGeneratorFlow",
    inputSchema: z.object({
      prompt: z.string(),
      model: z.any(),
      config: z.any().optional(),
      schemas: z.any(), // Changed from schema to schemas
    }),
    outputSchema: z.any(),
  },
  async ({ prompt, model, config, schemas }) => {
    const schemaDefs = Object.values(schemas)
      .map((s: any) => JSON.stringify(s, null, 2))
      .join("\n\n");

    const fullPrompt = `You are an AI assistant. Based on the following request, generate a JSON object that conforms to the provided JSON Schemas.
The output MUST be ONLY the JSON object enclosed in a markdown code block.
DO NOT include any other text before or after the markdown code block.

Request:
${prompt}

JSON Schemas:
${schemaDefs}
`;

    // Generate text response
    const { output } = await ai.generate({
      prompt: fullPrompt,
      model,
      config,
    });

    if (!output) throw new Error("Failed to generate component");

    return output;
  }
);
