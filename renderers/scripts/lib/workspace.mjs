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

import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs';
import {join, resolve, relative, dirname} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT_DIR = resolve(__dirname, '../../../');

/**
 * Finds all package.json files in the repository, excluding node_modules.
 */
export function findPackages(dir = ROOT_DIR, packageList = []) {
  const files = readdirSync(dir);

  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;

    const fullPath = join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      findPackages(fullPath, packageList);
    } else if (file === 'package.json') {
      packageList.push(fullPath);
    }
  }

  return packageList;
}

/**
 * Gets info about all packages and their internal dependencies.
 */
export function getPackageGraph() {
  const packagePaths = findPackages();
  const packages = {};

  for (const path of packagePaths) {
    const pkg = JSON.parse(readFileSync(path, 'utf8'));
    const dir = dirname(path);

    // If we have a duplicate name, prioritize packages in 'renderers/'
    // or those that are not private (if one is private and other isn't)
    if (packages[pkg.name]) {
      const existing = packages[pkg.name];
      const isNewInRenderers = dir.includes('/renderers/');
      const isExistingInRenderers = existing.dir.includes('/renderers/');

      if (isExistingInRenderers && !isNewInRenderers) continue;
      if (isExistingInRenderers === isNewInRenderers) {
        const newScriptsCount = Object.keys(pkg.scripts || {}).length;
        const existingScriptsCount = Object.keys(
          JSON.parse(readFileSync(existing.path, 'utf8')).scripts || {},
        ).length;
        if (newScriptsCount <= existingScriptsCount) continue;
      }
    }

    packages[pkg.name] = {
      name: pkg.name,
      version: pkg.version,
      path: path,
      dir: dir,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      peerDependencies: pkg.peerDependencies || {},
      private: !!pkg.private,
    };
  }

  // Build dependency map
  for (const name in packages) {
    const pkg = packages[name];
    pkg.internalDependencies = [];

    const allDeps = {...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies};
    for (const depName in allDeps) {
      if (packages[depName] && allDeps[depName].startsWith('file:')) {
        pkg.internalDependencies.push(depName);
      }
    }
  }

  return packages;
}

/**
 * Increments a version string.
 * Supports: 0.9.2 -> 0.9.3, 0.9.2-beta.1 -> 0.9.2-beta.2
 */
export function incrementVersion(version) {
  const parts = version.split('.');
  const lastPart = parts[parts.length - 1];

  // Check if last part is numeric or ends with a number
  const match = lastPart.match(/^(.*?)(\d+)$/);
  if (match) {
    const prefix = match[1];
    const num = parseInt(match[2], 10);
    parts[parts.length - 1] = `${prefix}${num + 1}`;
    return parts.join('.');
  }

  return version + '.1'; // Fallback
}

/**
 * Runs a shell command and returns the result.
 */
export function runCommand(command, args, options = {}) {
  console.log(`> Running: ${command} ${args.join(' ')} ${options.cwd ? `in ${options.cwd}` : ''}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }

  return result;
}
