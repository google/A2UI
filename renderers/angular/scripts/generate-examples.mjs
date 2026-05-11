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
import {parseArgs} from 'node:util';

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
  help: {type: 'boolean', short: 'h'},
  'out-file': {type: 'string', short: 'o', default: DEFAULT_OUT_FILE},
  'spec-path': {type: 'string', short: 's', default: DEFAULT_SPEC_PATH},
  catalog: {type: 'string', short: 'c', multiple: true, default: DEFAULT_CATALOGS},
  'override-minimal-catalog-id': {type: 'boolean', default: true},
};

/**
 * The help message that is displayed when the -h or --help flag is used.
 */
const HELP_MESSAGE = `Usage: node generate-examples.mjs [options]

Options:
  -o, --out-file <path>   Output file path (default: ${DEFAULT_OUT_FILE})
  -s, --spec-path <path>   Specification path (default: ${DEFAULT_SPEC_PATH})
  -c, --catalog <name>   Catalog names to include (can be specified multiple times) (default: ${DEFAULT_CATALOGS.join(', ')})
  --no-override-minimal-catalog-id  Do not override catalog ID for minimal catalog
  -h, --help             Show this help message
`;

/**
 * Overrides the catalog ID for minimal catalog to use basic catalog instead,
 * preserving the version in the path.
 */
function overrideMessagesCatalogId(messages) {
  const overrideCatalogId = catalogId => {
    return catalogId.replace('catalogs/minimal/minimal_catalog.json', 'basic_catalog.json');
  };
  for (const msg of messages) {
    // For v0.9 (and up?)
    if (msg.createSurface && msg.createSurface.catalogId) {
      msg.createSurface.catalogId = overrideCatalogId(msg.createSurface.catalogId);
    }
    // The minimal catalog examples in 0.8 contain a catalogId (but not the basic
    // catalog ones). That's probably copy-pasta from when catalogIds were
    // introduced later, as the v0.8 renderers didn't use catalogIds. We don't
    // need to handle the overrides of the catalogId for the beginRendering
    // messages from the v0.8 spec.
  }
}

/**
 * Main execution function for the script.
 * Parses arguments, reads catalog examples, and generates the TypeScript bundle.
 */
async function main() {
  const {values} = parseArgs({options, allowNegative: true});

  if (values.help) {
    console.log(HELP_MESSAGE);
    return;
  }

  const outPath = values['out-file'];
  const specPath = values['spec-path'];
  const outDir = path.dirname(outPath);
  const overrideCatalogId = values['override-minimal-catalog-id'];

  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, {recursive: true});
  }

  const catalogs = values.catalog;
  const examples = [];

  for (const catalog of catalogs) {
    const examplesDir = path.join(specPath, catalog, 'examples');
    if (fs.existsSync(examplesDir)) {
      const files = fs
        .readdirSync(examplesDir)
        .filter(f => f.endsWith('.json'))
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
            .replace(/\b\w/g, l => l.toUpperCase());

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

          // In the Angular Demo we only load the basic catalog (a superset of the minimal one).
          // Rewrite the catalogId for minimal examples to use basic_catalog.json
          if (catalog === 'minimal' && overrideCatalogId) {
            overrideMessagesCatalogId(example.messages);
          }

          examples.push(example);
        } catch (e) {
          throw new Error(`Error parsing ${filePath}`, {cause: e});
        }
      }
    } else {
      throw new Error(`Examples directory for catalog '${catalog}' does not exist: ${examplesDir}`);
    }
  }
  if (examples.length === 0) {
    throw new Error(`No examples found for catalogs: ${catalogs.join(', ')}`);
  }

  // Generate the file now!
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
main().catch(err => {
  console.error(err);
  process.exit(1);
});
