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

import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// This script prepares the Core package for publishing by:
// 1. Copying package.json to dist/
// 2. Adjusting paths in package.json (main, types, exports) to be relative to dist/

const dirname = import.meta.dirname;
const pkgPath = join(dirname, './package.json');
const distDir = join(dirname, './dist');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// 1. Read Package
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

// 2. Adjust Paths for Dist
pkg.main = adjustPath(pkg.main);
pkg.types = adjustPath(pkg.types);

if (pkg.exports) {
  for (const key in pkg.exports) {
    const exp = pkg.exports[key];
    if (typeof exp === 'string') {
      pkg.exports[key] = adjustPath(exp);
    } else {
      if (exp.types) exp.types = adjustPath(exp.types);
      if (exp.default) exp.default = adjustPath(exp.default);
      if (exp.import) exp.import = adjustPath(exp.import);
      if (exp.require) exp.require = adjustPath(exp.require);
    }
  }
}

// Remove properties that should not be in the published package
delete pkg.scripts;
delete pkg.wireit;
delete pkg.files;
delete pkg.prepublishOnly;

// 3. Write to dist/package.json
writeFileSync(join(distDir, 'package.json'), JSON.stringify(pkg, null, 2));

// 4. Copy README and LICENSE
const readmeSrc = join(dirname, 'README.md');
const licenseSrc = join(dirname, '../../LICENSE');

if (!existsSync(readmeSrc)) {
  throw new Error(`Missing required file for publishing: README.md`);
}
copyFileSync(readmeSrc, join(distDir, 'README.md'));

if (!existsSync(licenseSrc)) {
  throw new Error(`Missing required file for publishing: LICENSE`);
}
copyFileSync(licenseSrc, join(distDir, 'LICENSE'));

console.log(`Prepared dist/package.json for @a2ui/web_core@${pkg.version}`);

// Utility function to adjust the paths of the built files (dist/src/*) to (src/*)
function adjustPath(p) {
  if (p && p.startsWith('./dist/')) {
    return './' + p.substring(7); // Remove ./dist/
  }
  return p;
}
