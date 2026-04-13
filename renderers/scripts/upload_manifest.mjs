#!/usr/bin/env node
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

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getPackageGraph, runCommand, ROOT_DIR } from './lib/workspace.mjs';

// Configuration - adjust these as needed for your environment
const GCS_URI = process.env.A2UI_NPM_MANIFEST_GCS_URI || 'gs://oss-exit-gate-prod-projects-bucket/a2ui/npm/manifests';

const graph = getPackageGraph();
const renderers = Object.values(graph).filter(p => p.dir.includes('/renderers/'));

const manifest = {
  publish_all: true,
  packages: {}
};

for (const pkg of renderers) {
  manifest.packages[pkg.name] = pkg.version;
}

const manifestPath = join(ROOT_DIR, 'manifest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log('--- Generated manifest.json ---');
console.log(JSON.stringify(manifest, null, 2));

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-mm-ss
// Find the version of a representative package for the manifest name
const mainVersion = graph['@a2ui/web_core']?.version;
if (!mainVersion) {
  throw new Error('Could not find @a2ui/web_core in workspace. Ensure you are running from the correct directory.');
}
const manifestFileName = `manifest-${mainVersion}-${timestamp}.json`;

console.log(`--- Uploading manifest to GCS: ${GCS_URI}/${manifestFileName} ---`);

try {
  runCommand('gcloud', ['storage', 'cp', manifestPath, `${GCS_URI}/${manifestFileName}`]);
  console.log('Manifest uploaded successfully.');
} catch (error) {
  console.error('Failed to upload manifest. Ensure gcloud is authenticated and you have permissions.');
  process.exit(1);
}
