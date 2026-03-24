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

const outDir = 'a2ui_explorer/src/app/generated';
const outPath = path.join(outDir, 'examples-bundle.ts');
const specPath = '../../specification/v0_9/json/catalogs';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const catalogs = ['minimal', 'basic'];
const examples = [];

for (const catalog of catalogs) {
  const examplesDir = path.join(specPath, catalog, 'examples');
  if (fs.existsSync(examplesDir)) {
    const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.json')).sort();
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
            messages: data
          };
        } else if (!data.name || !data.messages) {
          example = {
            name: data.name || nameFromFile,
            description: data.description || `Example from ${catalog} catalog`,
            messages: data.messages || []
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
