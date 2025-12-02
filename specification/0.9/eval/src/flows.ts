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
import { ModelConfiguration } from "./models";
import { rateLimiter } from "./rateLimiter";
import { logger } from "./logger";

const plugins = [];

if (process.env.GEMINI_API_KEY) {
  logger.info("Initializing Google AI plugin...");
  plugins.push(
    googleAI({
      apiKey: process.env.GEMINI_API_KEY!,
      experimental_debugTraces: true,
    })
  );
}
if (process.env.OPENAI_API_KEY) {
  logger.info("Initializing OpenAI plugin...");
  plugins.push(openAI());
}
if (process.env.ANTHROPIC_API_KEY) {
  logger.info("Initializing Anthropic plugin...");
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
      modelConfig: z.any(), // Ideally, we'd have a Zod schema for ModelConfiguration
      schemas: z.any(),
    }),
    outputSchema: z.any(),
  },
  async ({ prompt, modelConfig, schemas }) => {
    const schemaDefs = Object.values(schemas)
      .map((s: any) => JSON.stringify(s, null, 2))
      .join("\n\n");

    const fullPrompt = `You are an AI assistant. Based on the following request, generate a JSON object that conforms to the provided JSON Schemas. The output MUST be ONLY the JSON object enclosed in a markdown code block.

DO NOT include any other text before or after the markdown code block.

Example Output:
\`\`\`json
{
  "updateComponents": {
    "surfaceId": "contact_form_1",
    "components": [
      {
        "id": "root",
        "props": {
          "component": "Column",
          "children": [
            "first_name_label",
            "first_name_field"
          ]
        }
      },
      {
        "id": "first_name_label",
        "props": {
          "component": "Text",
          "text": "First Name"
        }
      },
      {
        "id": "first_name_field",
        "props": {
          "component": "TextField",
          "label": "First Name",
          "text": { "path": "/contact/firstName" },
          "textFieldType": "shortText"
        }
      }
    ]
  }
}
\`\`\`

Request:
${prompt}

JSON Schemas:
${schemaDefs}
`;
    const estimatedInputTokens = Math.ceil(fullPrompt.length / 2.5);
    await rateLimiter.acquirePermit(
      modelConfig as ModelConfiguration,
      estimatedInputTokens
    );

    // Generate text response
    let response;
    const startTime = Date.now();
    try {
      response = await ai.generate({
        prompt: fullPrompt,
        model: modelConfig.model,
        config: modelConfig.config,
      });
    } catch (e) {
      logger.error(`Error during ai.generate: ${e}`);
      rateLimiter.reportError(modelConfig as ModelConfiguration, e);
      throw e;
    }
    const latency = Date.now() - startTime;

    if (!response) throw new Error("Failed to generate component");

    let candidate = (response as any).candidates?.[0];

    // Fallback for different response structure (e.g. Genkit 0.9+ or specific model adapters)
    if (!candidate && (response as any).message) {
      const message = (response as any).message;
      candidate = {
        index: 0,
        content: message.content,
        finishReason: "STOP", // Assume STOP if not provided in this format
        message: message,
      };
    }

    if (!candidate) {
      logger.error(
        `No candidates returned in response. Full response: ${JSON.stringify(response, null, 2)}`
      );
      throw new Error("No candidates returned");
    }

    if (
      candidate.finishReason !== "STOP" &&
      candidate.finishReason !== undefined
    ) {
      logger.warn(
        `Model finished with reason: ${candidate.finishReason}. Content: ${JSON.stringify(
          candidate.content
        )}`
      );
    }

    // Record token usage (adjusting for actual usage)
    const inputTokens = response.usage?.inputTokens || 0;
    const outputTokens = response.usage?.outputTokens || 0;
    const totalTokens = inputTokens + outputTokens;

    // We already recorded estimatedInputTokens. We need to record the difference.
    // If actual > estimated, we record the positive difference.
    // If actual < estimated, we technically over-counted, but RateLimiter doesn't support negative adjustments yet.
    // For safety, we just record any *additional* tokens if we under-estimated.
    // And we definitely record the output tokens.

    const additionalInputTokens = Math.max(
      0,
      inputTokens - estimatedInputTokens
    );
    const tokensToAdd = additionalInputTokens + outputTokens;

    if (tokensToAdd > 0) {
      rateLimiter.recordUsage(
        modelConfig as ModelConfiguration,
        tokensToAdd,
        false
      );
    }

    return { text: response.text, latency };
  }
);
