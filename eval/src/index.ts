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

import { componentGeneratorFlow, ai } from "./flows";
import * as fs from "fs";
import * as path from "path";
import { modelsToTest } from "./models";
import { prompts, TestPrompt } from "./prompts";
import { validateSchema } from "./validator";

interface InferenceResult {
  modelName: string;
  prompt: TestPrompt;
  component: any;
  error: any;
  latency: number;
  validationResults: string[];
  runNumber: number;
}

function generateSummary(
  resultsByModel: Record<string, InferenceResult[]>,
  results: InferenceResult[],
): string {
  const promptNameWidth = 40;
  const latencyWidth = 20;
  const failedRunsWidth = 15;
  const toolErrorRunsWidth = 20;

  let summary = "# Evaluation Summary";
  for (const modelName in resultsByModel) {
    summary += `\n\n## Model: ${modelName}\n\n`;
    const header = `| ${"Prompt Name".padEnd(
      promptNameWidth,
    )} | ${"Avg Latency (ms)".padEnd(latencyWidth)} | ${"Failed Runs".padEnd(
      failedRunsWidth,
    )} | ${"Tool Error Runs".padEnd(toolErrorRunsWidth)} |`;
    const divider = `|${"-".repeat(promptNameWidth + 2)}|${"-".repeat(
      latencyWidth + 2,
    )}|${"-".repeat(failedRunsWidth + 2)}|${"-".repeat(
      toolErrorRunsWidth + 2,
    )}|`;
    summary += header;
    summary += `\n${divider}`;

    const promptsInModel = resultsByModel[modelName].reduce(
      (acc, result) => {
        if (!acc[result.prompt.name]) {
          acc[result.prompt.name] = [];
        }
        acc[result.prompt.name].push(result);
        return acc;
      },
      {} as Record<string, InferenceResult[]>,
    );

    let totalModelFailedRuns = 0;

    for (const promptName in promptsInModel) {
      const runs = promptsInModel[promptName];
      const totalRuns = runs.length;
      const errorRuns = runs.filter((r) => r.error).length;
      const failedRuns = runs.filter(
        (r) => r.error || r.validationResults.length > 0,
      ).length;
      const totalLatency = runs.reduce((acc, r) => acc + r.latency, 0);
      const avgLatency = (totalLatency / totalRuns).toFixed(0);

      totalModelFailedRuns += failedRuns;

      const failedRunsStr =
        failedRuns > 0 ? `${failedRuns} / ${totalRuns}` : "";
      const errorRunsStr = errorRuns > 0 ? `${errorRuns} / ${totalRuns}` : "";

      summary += `\n| ${promptName.padEnd(
        promptNameWidth,
      )} | ${avgLatency.padEnd(latencyWidth)} | ${failedRunsStr.padEnd(
        failedRunsWidth,
      )} | ${errorRunsStr.padEnd(toolErrorRunsWidth)} |`;
    }

    const totalRunsForModel = resultsByModel[modelName].length;
    summary += `\n\n**Total failed runs:** ${totalModelFailedRuns} / ${totalRunsForModel}`;
  }

  summary += "\n\n---\n\n## Overall Summary\n";
  const totalRuns = results.length;
  const totalToolErrorRuns = results.filter((r) => r.error).length;
  const totalRunsWithAnyFailure = results.filter(
    (r) => r.error || r.validationResults.length > 0,
  ).length;
  const modelsWithFailures = [
    ...new Set(
      results
        .filter((r) => r.error || r.validationResults.length > 0)
        .map((r) => r.modelName),
    ),
  ].join(", ");

  summary += `\n- **Number of tool error runs:** ${totalToolErrorRuns} / ${totalRuns}`;
  summary += `\n- **Number of runs with any failure (tool error or validation):** ${totalRunsWithAnyFailure} / ${totalRuns}`;
  if (modelsWithFailures) {
    summary += `\n- **Models with at least one failure:** ${modelsWithFailures}`;
  }
  return summary;
}

// Run the flow
async function main() {
  const args = process.argv.slice(2).reduce(
    (acc, arg) => {
      const [key, value] = arg.split("=");
      if (key.startsWith("--")) {
        if (value) {
          acc[key.substring(2)] = value;
        } else {
          acc[key.substring(2)] = true;
        }
      }
      return acc;
    },
    {} as Record<string, string | boolean>,
  );

  const verbose = !!args.verbose;
  const keep = args.keep;
  let outputDir: string | null = null;

  if (keep) {
    if (typeof keep === "string") {
      outputDir = keep;
    } else {
      outputDir = fs.mkdtempSync(path.join(process.cwd(), "a2ui-eval-"));
    }
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    console.log(`Keeping output in: ${outputDir}`);
  }

  const runsPerPrompt = parseInt(args["runs-per-prompt"] as string, 10) || 1;

  let filteredModels = modelsToTest;
  if (typeof args.model === "string") {
    filteredModels = modelsToTest.filter((m) =>
      m.name.startsWith(args.model as string),
    );
    if (filteredModels.length === 0) {
      console.error(`No model found with prefix "${args.model}".`);
      process.exit(1);
    }
  }

  let filteredPrompts = prompts;
  if (typeof args.prompt === "string") {
    filteredPrompts = prompts.filter((p) =>
      p.name.startsWith(args.prompt as string),
    );
    if (filteredPrompts.length === 0) {
      console.error(`No prompt found with prefix "${args.prompt}".`);
      process.exit(1);
    }
  }

  const generationPromises: Promise<InferenceResult>[] = [];

  for (const prompt of filteredPrompts) {
    const schemaString = fs.readFileSync(
      path.join(__dirname, prompt.schemaPath),
      "utf-8",
    );
    const schema = JSON.parse(schemaString);
    for (const modelConfig of filteredModels) {
      const modelDirName = modelConfig.name.replace(/[\/:]/g, "_");
      const modelOutputDir = outputDir
        ? path.join(outputDir, modelDirName)
        : null;
      if (modelOutputDir && !fs.existsSync(modelOutputDir)) {
        fs.mkdirSync(modelOutputDir, { recursive: true });
      }
      for (let i = 1; i <= runsPerPrompt; i++) {
        console.log(
          `Queueing generation for model: ${modelConfig.name}, prompt: ${prompt.name} (run ${i})`,
        );
        const startTime = Date.now();
        generationPromises.push(
          componentGeneratorFlow({
            prompt: prompt.promptText,
            model: modelConfig.model,
            config: modelConfig.config,
            schema,
          })
            .then((component) => {
              if (modelOutputDir) {
                const inputPath = path.join(
                  modelOutputDir,
                  `${prompt.name}.input.txt`,
                );
                fs.writeFileSync(inputPath, prompt.promptText);

                const outputPath = path.join(
                  modelOutputDir,
                  `${prompt.name}.output.json`,
                );
                fs.writeFileSync(
                  outputPath,
                  JSON.stringify(component, null, 2),
                );
              }
              const validationResults = validateSchema(
                component,
                prompt.schemaPath,
                prompt.matchers,
              );
              return {
                modelName: modelConfig.name,
                prompt,
                component,
                error: null,
                latency: Date.now() - startTime,
                validationResults,
                runNumber: i,
              };
            })
            .catch((error) => {
              if (modelOutputDir) {
                const inputPath = path.join(
                  modelOutputDir,
                  `${prompt.name}.input.txt`,
                );
                fs.writeFileSync(inputPath, prompt.promptText);

                const errorPath = path.join(
                  modelOutputDir,
                  `${prompt.name}.error.json`,
                );
                const errorOutput = {
                  message: error.message,
                  stack: error.stack,
                  ...error,
                };
                fs.writeFileSync(
                  errorPath,
                  JSON.stringify(errorOutput, null, 2),
                );
              }
              return {
                modelName: modelConfig.name,
                prompt,
                component: null,
                error,
                latency: Date.now() - startTime,
                validationResults: [],
                runNumber: i,
              };
            }),
        );
      }
    }
  }

  const results = await Promise.all(generationPromises);

  const resultsByModel: Record<string, InferenceResult[]> = {};

  for (const result of results) {
    if (!resultsByModel[result.modelName]) {
      resultsByModel[result.modelName] = [];
    }
    resultsByModel[result.modelName].push(result);
  }

  console.log("\n--- Generation Results ---");
  for (const modelName in resultsByModel) {
    for (const result of resultsByModel[modelName]) {
      const hasError = !!result.error;
      const hasValidationFailures = result.validationResults.length > 0;
      const hasComponent = !!result.component;

      if (hasError || hasValidationFailures || (verbose && hasComponent)) {
        console.log(`\n----------------------------------------`);
        console.log(`Model: ${modelName}`);
        console.log(`----------------------------------------`);
        console.log(`\nQuery: ${result.prompt.name} (run ${result.runNumber})`);

        if (hasError) {
          console.error("Error generating component:", result.error);
        } else if (hasComponent) {
          if (hasValidationFailures) {
            console.log("Validation Failures:");
            result.validationResults.forEach((failure) =>
              console.log(`- ${failure}`),
            );
          }
          if (verbose) {
            if (hasValidationFailures) {
              console.log("Generated schema:");
              console.log(JSON.stringify(result.component, null, 2));
            }
          }
        }
      }
    }
  }

  const summary = generateSummary(resultsByModel, results);
  console.log(summary);
  if (outputDir) {
    const summaryPath = path.join(outputDir, "summary.md");
    fs.writeFileSync(summaryPath, summary);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
