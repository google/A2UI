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

// This script prepares the markdown-it package for publishing by:
// 1. Copying package.json to dist/
// 2. Updating @a2ui/web_core dependency from 'file:...' to the actual version
// 3. Adjusting paths in package.json (main, types, exports) to be relative to dist/

const dirname = import.meta.dirname;
const corePkgPath = join(dirname, '../../web_core/package.json');
const pkgPath = join(dirname, './package.json');
const distDir = join(dirname, './dist');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// 1. Get Core Version
const corePkg = JSON.parse(readFileSync(corePkgPath, 'utf8'));
const coreVersion = corePkg.version;
if (!coreVersion) throw new Error('Cannot determine @a2ui/web_core version');

// 2. Read Package
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

// 3. Update Dependency
if (pkg.peerDependencies && pkg.peerDependencies['@a2ui/web_core']) {
  pkg.peerDependencies['@a2ui/web_core'] = '^' + coreVersion;
} else {
  console.warn('Warning: @a2ui/web_core not found in peerDependencies.');
}
if (pkg.devDependencies && pkg.devDependencies['@a2ui/web_core']) {
  // We can just remove devDependencies for the published package, or update it
  pkg.devDependencies['@a2ui/web_core'] = '^' + coreVersion;
}

// 4. Adjust Paths for Dist
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

// Remove files and wireit properties since we are publishing the dist folder directly
delete pkg.files;
delete pkg.wireit;
delete pkg.scripts;

// 5. Write to dist/package.json
writeFileSync(join(distDir, 'package.json'), JSON.stringify(pkg, null, 2));

// 6. Copy README and LICENSE
// LICENSE is in the root directory for this package structure, or we can copy from parent
const licenseSrc = join(dirname, '../../../LICENSE');
const readmeSrc = join(dirname, 'README.md');

if (existsSync(readmeSrc)) {
  copyFileSync(readmeSrc, join(distDir, 'README.md'));
}
if (existsSync(licenseSrc)) {
  copyFileSync(licenseSrc, join(distDir, 'LICENSE'));
} else {
  console.warn("Could not find LICENSE at " + licenseSrc);
}

console.log(`Prepared dist/package.json with @a2ui/web_core@${coreVersion}`);

// Utility function to adjust the paths of the built files (dist/src/*) to (src/*)
function adjustPath(p) {
  if (p && p.startsWith('./dist/')) {
    return './' + p.substring(7); // Remove ./dist/
  }
  return p;
}
