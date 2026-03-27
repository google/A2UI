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
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function syncDir(sourceDir, targetDir) {
  console.log(`Syncing specs from ${sourceDir} to ${targetDir}...`);
  fs.mkdirSync(targetDir, { recursive: true });

  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.json'));

  files.forEach(f => {
    const sourcePath = path.join(sourceDir, f);
    const targetPath = path.join(targetDir, f);
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`  Copied ${f}`);
  });

  const indexFiles = fs.readdirSync(targetDir).filter(f => f.endsWith('.json') && f !== 'index.json');
  fs.writeFileSync(path.join(targetDir, 'index.json'), JSON.stringify(indexFiles, null, 2));

  console.log(`Generated manifest for ${indexFiles.length} files.`);
}

syncDir(
  path.resolve(process.cwd(), '../../../../specification/v0_9/json/catalogs/minimal/examples'),
  path.resolve(process.cwd(), 'public/specs/v0_9/minimal/examples')
);

syncDir(
  path.resolve(process.cwd(), '../../../../specification/v0_9/json/catalogs/basic/examples'),
  path.resolve(process.cwd(), 'public/specs/v0_9/basic/examples')
);