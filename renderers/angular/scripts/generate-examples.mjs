/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import fs from 'fs';
import path from 'path';
import { parseArgs } from 'node:util';

/**
 * The default output file path where the generated examples bundle will be written.
 */
const DEFAULT_OUT_FILE = 'a2ui_explorer/src/app/generated/examples-bundle.ts';

/**
 * The default path to the directory containing the JSON specification catalogs.
 */
const DEFAULT_SPEC_PATH = '../../specification/v0_9/json/catalogs';

/**
 * The default catalogs to generate examples for if none are specified.
 */
const DEFAULT_CATALOGS = ['minimal', 'basic'];

/**
 * The options that this script accepts.
 */
const options = {
  help: { type: 'boolean', short: 'h' },
  outFile: { type: 'string', short: 'o', default: DEFAULT_OUT_FILE },
  specPath: { type: 'string', short: 's', default: DEFAULT_SPEC_PATH },
  catalog: { type: 'string', short: 'c', multiple: true, default: DEFAULT_CATALOGS },
};

/**
 * The help message that is displayed when the -h or --help flag is used.
 */
const HELP_MESSAGE = `Usage: node generate-examples.mjs [options]

Options:
  -o, --outFile <path>   Output file path (default: ${DEFAULT_OUT_FILE})
  -s, --specPath <path>   Specification path (default: ${DEFAULT_SPEC_PATH})
  -c, --catalog <name>   Catalog names to include (can be specified multiple times) (default: ${DEFAULT_CATALOGS.join(', ')})
  -h, --help             Show this help message
`;

/**
 * Main execution function for the script.
 * Parses arguments, reads catalog examples, and generates the TypeScript bundle.
 */
async function main() {
  const { values } = parseArgs({ options });

  if (values.help) {
    console.log(HELP_MESSAGE);
    return;
  }

  const outPath = values.outFile;
  const specPath = values.specPath;
  const outDir = path.dirname(outPath);

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const catalogs = values.catalog;
  const examples = [];

  for (const catalog of catalogs) {
    const examplesDir = path.join(specPath, catalog, 'examples');
    if (fs.existsSync(examplesDir)) {
      const files = fs
        .readdirSync(examplesDir)
        .filter((f) => f.endsWith('.json'))
        .sort();
      for (const file of files) {
        const filePath = path.join(examplesDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        try {
          const data = JSON.parse(content);
          let example = data;

          const nameFromFile = file
            .replace('.json', '')
            .replace(/^[0-9]+_/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (l) => l.toUpperCase());

          // Ensure it's in the Example format
          if (Array.isArray(data)) {
            example = {
              name: nameFromFile,
              description: `Example from ${catalog} catalog`,
              messages: data,
            };
          } else if (!data.name || !data.messages) {
            example = {
              name: data.name || nameFromFile,
              description: data.description || `Example from ${catalog} catalog`,
              messages: data.messages || [],
            };
          }

          // In the Angular Demo we only load the basic catalog (which implements minimal components as well).
          // Rewrite the catalogId for minimal examples to use basic_catalog.json
          if (catalog === 'minimal') {
            for (const msg of example.messages) {
              if (msg.createSurface && msg.createSurface.catalogId) {
                msg.createSurface.catalogId =
                  'https://a2ui.org/specification/v0_9/basic_catalog.json';
              }
            }
          }

          examples.push(example);
        } catch (e) {
          console.error(`Error parsing ${filePath}:`, e);
        }
      }
    } else {
      console.error(`Examples directory for catalog '${catalog}' does not exist: ${examplesDir}`);
    }
  }

  const tsContent = `/**
 * Generated file. Do not edit directly.
 */

import { Example } from '../types';

export const EXAMPLES: Example[] = ${JSON.stringify(examples, null, 2)};
`;

  fs.writeFileSync(outPath, tsContent);
  console.log(`Generated ${examples.length} examples to ${outPath}`);
}

/**
 * Entry point of the script.
 */
main().catch((err) => {
  console.error(err);
  process.exit(1);
});
