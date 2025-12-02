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
import { rateLimiter } from "./rateLimiter";
import { logger, setupLogger } from "./logger";
import Ajv from "ajv";

const schemaFiles = [
  "../../json/common_types.json",
  "../../json/standard_catalog_definition.json",
  "../../json/server_to_client.json",
];

// const schemaFiles = [
//   "../../../0.8/json/server_to_client_with_standard_catalog.json",
// ];

// Add this function to extract JSON from markdown
function extractJsonFromMarkdown(markdown: string): any | null {
  const jsonBlockMatch = markdown.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    try {
      return JSON.parse(jsonBlockMatch[1]);
    } catch (error) {
      logger.error(`Failed to parse JSON from markdown: ${error}`);
      return null;
    }
  }
  return null;
}

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
  results: InferenceResult[]
): string {
  const promptNameWidth = 40;
  const latencyWidth = 20;
  const failedRunsWidth = 15;

  let summary = "# Evaluation Summary";
  for (const modelName in resultsByModel) {
    summary += `\n\n## Model: ${modelName}\n\n`;
    const header = `| ${"Prompt Name".padEnd(
      promptNameWidth
    )} | ${"Avg Latency (ms)".padEnd(latencyWidth)} | ${"Failed Runs".padEnd(
      failedRunsWidth
    )} |`;
    const divider = `|${"-".repeat(promptNameWidth + 2)}|${"-".repeat(
      latencyWidth + 2
    )}|${"-".repeat(failedRunsWidth + 2)}|`;
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
      {} as Record<string, InferenceResult[]>
    );

    let totalModelFailedRuns = 0;

    for (const promptName in promptsInModel) {
      const runs = promptsInModel[promptName];
      const totalRuns = runs.length;
      const failedRuns = runs.filter(
        (r) => r.error || r.validationResults.length > 0
      ).length;
      const totalLatency = runs.reduce((acc, r) => acc + r.latency, 0);
      const avgLatency = (totalLatency / totalRuns).toFixed(0);

      totalModelFailedRuns += failedRuns;

      const failedRunsStr =
        failedRuns > 0 ? `${failedRuns} / ${totalRuns}` : "";

      summary += `\n| ${promptName.padEnd(
        promptNameWidth
      )} | ${avgLatency.padEnd(latencyWidth)} | ${failedRunsStr.padEnd(
        failedRunsWidth
      )} |`;
    }

    const totalRunsForModel = resultsByModel[modelName].length;
    summary += `\n\n**Total failed runs:** ${totalModelFailedRuns} / ${totalRunsForModel}`;
  }

  summary += "\n\n---\n\n## Overall Summary\n";
  const totalRuns = results.length;
  const totalToolErrorRuns = results.filter((r) => r.error).length;
  const totalRunsWithAnyFailure = results.filter(
    (r) => r.error || r.validationResults.length > 0
  ).length;
  const modelsWithFailures = [
    ...new Set(
      results
        .filter((r) => r.error || r.validationResults.length > 0)
        .map((r) => r.modelName)
    ),
  ].join(", ");

  summary += `\n- **Total tool failures:** ${totalToolErrorRuns} / ${totalRuns}`;
  summary += `\n- **Number of runs with any failure (tool error or validation):** ${totalRunsWithAnyFailure} / ${totalRuns}`;
  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
  const totalLatency = latencies.reduce((acc, l) => acc + l, 0);
  const meanLatency = (totalLatency / totalRuns).toFixed(0);
  let medianLatency = 0;
  if (latencies.length > 0) {
    const mid = Math.floor(latencies.length / 2);
    if (latencies.length % 2 === 0) {
      medianLatency = (latencies[mid - 1] + latencies[mid]) / 2;
    } else {
      medianLatency = latencies[mid];
    }
  }

  summary += `\n- **Mean Latency:** ${meanLatency} ms`;
  summary += `\n- **Median Latency:** ${medianLatency} ms`;

  if (modelsWithFailures) {
    summary += `\n- **Models with at least one failure:** ${modelsWithFailures}`;
  }
  return summary;
}

import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Run the flow
async function main() {
  const argv = await yargs(hideBin(process.argv))
    .option("log-level", {
      type: "string",
      description: "Set the logging level",
      default: "info",
      choices: ["debug", "info", "warn", "error"],
    })
    .option("results", {
      type: "string",
      description:
        "Directory to keep output files. If not specified, uses results/output-<model>. If specified, uses the provided directory (appending output-<model>).",
      coerce: (arg) => (arg === undefined ? true : arg),
      default: true,
    })
    .option("runs-per-prompt", {
      type: "number",
      description: "Number of times to run each prompt",
      default: 1,
    })
    .option("model", {
      type: "string",
      array: true,
      description: "Filter models by exact name",
      default: [],
      choices: modelsToTest.map((m) => m.name),
    })
    .option("prompt", {
      type: "string",
      array: true,
      description: "Filter prompts by name prefix",
    })
    .option("clean-results", {
      type: "boolean",
      description: "Clear the output directory before starting",
      default: false,
    })
    .help()
    .alias("h", "help").argv;

  let filteredModels = modelsToTest;
  if (argv.model && argv.model.length > 0) {
    const modelNames = argv.model as string[];
    filteredModels = modelsToTest.filter((m) => modelNames.includes(m.name));
    if (filteredModels.length === 0) {
      logger.error(`No models found matching: ${modelNames.join(", ")}.`);
      process.exit(1);
    }
  }

  let filteredPrompts = prompts;
  if (argv.prompt && argv.prompt.length > 0) {
    const promptPrefixes = argv.prompt as string[];
    filteredPrompts = prompts.filter((p) =>
      promptPrefixes.some((prefix) => p.name.startsWith(prefix))
    );
    if (filteredPrompts.length === 0) {
      logger.error(
        `No prompt found with prefix "${promptPrefixes.join(", ")}".`
      );
      process.exit(1);
    }
  }

  const ajv = new Ajv({ allErrors: true });

  const schemas: any = {};
  for (const file of schemaFiles) {
    const schemaString = fs.readFileSync(path.join(__dirname, file), "utf-8");
    const schema = JSON.parse(schemaString);
    schemas[file] = schema;
    if (schema.$id) {
      ajv.addSchema(schema, schema.$id);
    }
  }

  const runsPerPrompt = argv["runs-per-prompt"];

  for (const modelConfig of filteredModels) {
    const modelDirName = `output-${modelConfig.name.replace(/[\/:]/g, "_")}`;
    let outputDir: string;

    const resultsArg = argv.results;
    if (typeof resultsArg === "string") {
      if (filteredModels.length > 1) {
        outputDir = path.join(resultsArg, modelDirName);
      } else {
        outputDir = resultsArg;
      }
    } else {
      outputDir = path.join("results", modelDirName);
    }

    if (argv["clean-results"] && fs.existsSync(outputDir)) {
      fs.rmSync(outputDir, { recursive: true, force: true });
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const detailsDir = path.join(outputDir, "details");
    if (!fs.existsSync(detailsDir)) {
      fs.mkdirSync(detailsDir, { recursive: true });
    }

    setupLogger(outputDir, argv["log-level"]);
    logger.info(`Output directory: ${outputDir}`);

    const generationPromises: Promise<InferenceResult>[] = [];
    let completedCount = 0;
    let failedCount = 0;
    const totalJobs = filteredPrompts.length * runsPerPrompt;

    for (const prompt of filteredPrompts) {
      const runJob = async (
        runIndex: number,
        retryCount: number = 0
      ): Promise<InferenceResult> => {
        if (retryCount > 0) {
          logger.warn(
            `[${modelConfig.name}] Retrying prompt ${prompt.name} (run ${runIndex}, attempt ${retryCount + 1})`
          );
        } else {
          logger.verbose(
            `Queueing generation for model: ${modelConfig.name}, prompt: ${prompt.name} (run ${runIndex})`
          );
        }

        const startTime = Date.now();

        try {
          const output: any = await componentGeneratorFlow({
            prompt: prompt.promptText,
            modelConfig: modelConfig,
            schemas,
          });

          const text = output?.text;
          const latency = output?.latency || 0;

          let component = null;
          let error = null;
          let validationResults: string[] = [];

          if (text) {
            try {
              component = extractJsonFromMarkdown(text);

              // Validate against the main schema
              const validate = ajv.getSchema(
                "https://a2ui.dev/specification/0.9/server_to_client.json"
              );
              if (validate && !validate(component)) {
                validationResults = (validate.errors || []).map(
                  (err) => `${err.instancePath} ${err.message}`
                );
              }
              // Also run original validator for more specific checks
              validationResults = validationResults.concat(
                validateSchema(component, prompt.matchers)
              );

              if (outputDir) {
                const inputPath = path.join(
                  detailsDir,
                  `${prompt.name}.input.txt`
                );
                fs.writeFileSync(inputPath, prompt.promptText);

                const suffix =
                  validationResults.length > 0 ? ".failed.json" : ".json";
                const outputPath = path.join(
                  detailsDir,
                  `${prompt.name}.${runIndex}${suffix}`
                );
                fs.writeFileSync(
                  outputPath,
                  JSON.stringify(component, null, 2)
                );

                if (validationResults.length > 0) {
                  const failurePath = path.join(
                    detailsDir,
                    `${prompt.name}.${runIndex}.failed.txt`
                  );
                  fs.writeFileSync(failurePath, validationResults.join("\n"));
                }
              }
            } catch (e) {
              error = e;
              validationResults.push(
                "Failed to extract JSON from model output."
              );
              if (outputDir) {
                const errorPath = path.join(
                  detailsDir,
                  `${prompt.name}.${runIndex}.output.txt`
                );
                fs.writeFileSync(errorPath, text || "No output text.");
              }
            }
          } else {
            error = new Error("No output text returned from model");
          }

          return {
            modelName: modelConfig.name,
            prompt,
            component,
            error,
            latency,
            validationResults,
            runNumber: runIndex,
          };
        } catch (error: any) {
          // Retry logic for tool errors (not validation failures)
          if (retryCount < 1) {
            logger.warn(
              `Tool error for ${modelConfig.name}, prompt ${prompt.name}: ${error.message}. Retrying...`
            );
            return runJob(runIndex, retryCount + 1);
          }

          if (outputDir) {
            const inputPath = path.join(detailsDir, `${prompt.name}.input.txt`);
            fs.writeFileSync(inputPath, prompt.promptText);

            const errorPath = path.join(
              detailsDir,
              `${prompt.name}.${runIndex}.error.json`
            );
            const errorOutput = {
              message: error.message,
              stack: error.stack,
              ...error,
            };
            fs.writeFileSync(errorPath, JSON.stringify(errorOutput, null, 2));
          }
          return {
            modelName: modelConfig.name,
            prompt,
            component: null,
            error,
            latency: Date.now() - startTime,
            validationResults: [],
            runNumber: runIndex,
          };
        }
      };

      for (let i = 1; i <= runsPerPrompt; i++) {
        generationPromises.push(
          runJob(i).then((result) => {
            if (result.error) {
              failedCount++;
            } else {
              completedCount++;
            }
            return result;
          })
        );
      }
    }

    const progressInterval = setInterval(() => {
      const queuedCount = rateLimiter.waitingCount;
      const inProgressCount =
        totalJobs - completedCount - failedCount - queuedCount;
      const pct = Math.round(
        ((completedCount + failedCount) / totalJobs) * 100
      );
      process.stderr.write(
        `\r[${modelConfig.name}] Progress: ${pct}% | Completed: ${completedCount} | In Progress: ${inProgressCount} | Queued: ${queuedCount} | Failed: ${failedCount}          `
      );
    }, 1000);

    const results = await Promise.all(generationPromises);
    clearInterval(progressInterval);
    process.stderr.write("\n");

    const resultsByModel: Record<string, InferenceResult[]> = {};
    for (const result of results) {
      if (!resultsByModel[result.modelName]) {
        resultsByModel[result.modelName] = [];
      }
      resultsByModel[result.modelName].push(result);
    }

    logger.info("--- Generation Results ---");
    for (const modelName in resultsByModel) {
      for (const result of resultsByModel[modelName]) {
        const hasError = !!result.error;
        const hasValidationFailures = result.validationResults.length > 0;
        const hasComponent = !!result.component;

        if (hasError || hasValidationFailures) {
          logger.info(`----------------------------------------`);
          logger.info(`Model: ${modelName}`);
          logger.info(`----------------------------------------`);
          logger.info(`Query: ${result.prompt.name} (run ${result.runNumber})`);

          if (hasError) {
            logger.error(
              `Error generating component: ${JSON.stringify(result.error)}`
            );
          } else if (hasComponent) {
            if (hasValidationFailures) {
              logger.warn("Validation Failures:");
              result.validationResults.forEach((failure) =>
                logger.warn(`- ${failure}`)
              );
            }
            logger.verbose("Generated output:");
            logger.verbose(JSON.stringify(result.component, null, 2));
          }
        }
      }
    }

    const summary = generateSummary(resultsByModel, results);
    logger.info(summary);
    if (outputDir) {
      const summaryPath = path.join(outputDir, "summary.md");
      fs.writeFileSync(summaryPath, summary);
    }
  }
}
if (require.main === module) {
  main().catch(console.error);
}
