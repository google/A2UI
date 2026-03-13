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

/**
 * @fileoverview Synchronizes minimal v0.8 examples from the specification folder
 * into the local gallery's public assets and generates a manifest index.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_DIR = path.resolve(process.cwd(), 'public/specs/v0_8/minimal/examples');
const SOURCE_DIR = path.resolve(process.cwd(), '../../../../specification/v0_8/json/catalogs/minimal/examples');

console.log(`Syncing specs from ${SOURCE_DIR} to ${TARGET_DIR}...`);

// Ensure target directory exists
fs.mkdirSync(TARGET_DIR, { recursive: true });

// Read source files
const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.json'));

// Copy files
files.forEach(f => {
  const sourcePath = path.join(SOURCE_DIR, f);
  const targetPath = path.join(TARGET_DIR, f);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`  Copied ${f}`);
});

// Generate index.json (excluding itself)
const indexFiles = fs.readdirSync(TARGET_DIR).filter(f => f.endsWith('.json') && f !== 'index.json');
fs.writeFileSync(path.join(TARGET_DIR, 'index.json'), JSON.stringify(indexFiles, null, 2));

console.log(`Generated manifest for ${indexFiles.length} files.`);
