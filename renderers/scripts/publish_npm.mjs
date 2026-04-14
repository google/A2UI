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

import { getPackageGraph, runCommand as defaultRunCommand } from './lib/workspace.mjs';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as readline from 'node:readline';
import { fileURLToPath } from 'node:url';

export async function runPublish(args, customRunCommand, customExecSync, customReadline) {
  const runCmd = customRunCommand || defaultRunCommand;
  const exec = customExecSync || execSync;

  let packagesToPublish = [];
  let force = false;
  let autoYes = false;
  let dryRun = false;
  let skipTests = false;

  for (const arg of args) {
    if (arg.startsWith('--packages=')) {
      packagesToPublish = arg.split('=')[1].split(',');
    } else if (arg === '--force') {
      force = true;
    } else if (arg === '--yes') {
      autoYes = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--skip-tests') {
      skipTests = true;
    }
  }

  if (packagesToPublish.length === 0) {
    throw new Error('Usage: publish_npm --packages=pkg1,pkg2 [--force] [--yes] [--dry-run] [--skip-tests]');
  }

  const graph = getPackageGraph();

  // Resolve short names to full names
  const resolvedPackages = packagesToPublish.map(name => {
    if (graph[name]) return name;
    const pkg = Object.values(graph).find(p => p.name.endsWith('/' + name));
    if (!pkg) {
      throw new Error(`Package "${name}" not found in workspace.`);
    }
    return pkg.name;
  });

  // Validation: web_core check
  const webCoreName = '@a2ui/web_core';
  const renderers = ['@a2ui/lit', '@a2ui/angular', '@a2ui/react'];
  const requestedRenderers = resolvedPackages.filter(p => renderers.includes(p));

  if (requestedRenderers.length > 0 && !resolvedPackages.includes(webCoreName) && !force) {
    console.warn('WARNING: You are publishing renderers but NOT @a2ui/web_core.');
    console.warn('This can lead to broken versions if web_core has changed.');
    console.warn('Use --force to override this check.');
    throw new Error('Safety check failed: web_core missing from publish list.');
  }

  // Topological Sort
  function topologicalSort(pkgNames) {
    const sorted = [];
    const visited = new Set();
    const temp = new Set();

    function visit(name) {
      if (temp.has(name)) throw new Error(`Circular dependency detected involving ${name}`);
      if (visited.has(name)) return;

      temp.add(name);
      const pkg = graph[name];
      if (pkg) {
        for (const dep of pkg.internalDependencies) {
          if (pkgNames.includes(dep)) {
            visit(dep);
          }
        }
      }
      temp.delete(name);
      visited.add(name);
      sorted.push(name);
    }

    for (const name of pkgNames) {
      visit(name);
    }
    return sorted;
  }

  const sortedPackages = topologicalSort(resolvedPackages);

  function getVersionDiff(oldV, newV) {
    if (oldV === newV) return 'SAME';
    const [oCore, ...oPreArr] = oldV.split('-');
    const [nCore, ...nPreArr] = newV.split('-');
    const oPre = oPreArr.join('-');
    const nPre = nPreArr.join('-');

    const [oMaj, oMin, oPat] = oCore.split('.').map(Number);
    const [nMaj, nMin, nPat] = nCore.split('.').map(Number);

    if (nMaj > oMaj) return nPre ? 'PREMAJOR' : 'MAJOR';
    if (nMaj === oMaj && nMin > oMin) return nPre ? 'PREMINOR' : 'MINOR';
    if (nMaj === oMaj && nMin === oMin && nPat > oPat) return nPre ? 'PREPATCH' : 'PATCH';
    if (oCore === nCore) {
       if (oPre && !nPre) return 'GRADUATION (RELEASE)';
       if (!oPre && nPre) return 'OLDER_OR_UNKNOWN';
       return 'PRERELEASE';
    }

    return 'OLDER_OR_UNKNOWN';
  }

  console.log('--- Pre-flight Version Checks ---');
  for (const pkgName of sortedPackages) {
    const pkg = graph[pkgName];
    const localVersion = pkg.version;
    let remoteVersion;

    try {
      remoteVersion = exec(`npm view ${pkgName} version`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
    } catch (e) {
      remoteVersion = null;
    }

    if (!remoteVersion) {
      console.log(`✅ [NEW PACKAGE] ${pkgName}: Will be published for the first time as ${localVersion}`);
      continue;
    }

    if (remoteVersion === localVersion) {
      console.error(`\n❌ ERROR: ${pkgName} version ${localVersion} is already published on npm!`);
      console.error(`Please increment the version (e.g., using increment_version.mjs) before publishing.`);
      throw new Error(`Version ${localVersion} already published.`);
    }

    const diff = getVersionDiff(remoteVersion, localVersion);
    if (diff === 'OLDER_OR_UNKNOWN') {
       console.error(`\n❌ ERROR: ${pkgName} local version (${localVersion}) appears older or invalid compared to npm version (${remoteVersion})!`);
       throw new Error(`Invalid version progression for ${pkgName}.`);
    }

    console.log(`✅ [${diff}] ${pkgName}: ${remoteVersion} -> ${localVersion}`);
  }
  console.log('\nPre-flight checks passed.');

  console.log('\n--- Git Provenance Check ---');
  let currentBranch = 'unknown';
  let commitHash = 'unknown';
  let isDirty = false;

  try {
    currentBranch = exec('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    commitHash = exec('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    const status = exec('git status --porcelain', { encoding: 'utf8' }).trim();
    isDirty = status.length > 0;
  } catch (e) {
    console.warn('⚠️ Could not verify Git status. Ensure you are in a valid Git repository.');
  }

  if (isDirty) {
    console.warn(`\n⚠️  WARNING: Your Git working tree is DIRTY (you have uncommitted changes).`);
    console.warn(`Publishing from a dirty tree means the published code will NOT exactly match the commit history.`);
    console.warn(`It is highly recommended to commit or stash your changes before publishing.`);
  }

  console.log(`Publishing from branch: ${currentBranch}`);
  console.log(`Commit hash: ${commitHash}`);

  if (!autoYes) {
    const askUser = async () => {
      if (customReadline) return await customReadline();

      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      return await new Promise(resolve => {
        rl.question(`\nDo you want to proceed with publishing these versions from commit ${commitHash.substring(0, 7)}? (yes/no): `, (ans) => {
          rl.close();
          resolve(ans);
        });
      });
    };

    const answer = await askUser();
    if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
      console.log('Publishing cancelled by user.');
      return;
    }
  }

  console.log('\n--- Authenticating with Google Artifact Registry ---');
  if (dryRun) console.log('[DRY RUN] Would execute: npx google-artifactregistry-auth');
  else runCmd('npx', ['google-artifactregistry-auth']);

  console.log('\n--- Building and Testing all packages ---');
  for (const pkgName of sortedPackages) {
    const pkg = graph[pkgName];
    console.log(`\n=== Preparing ${pkg.name} (${pkg.version}) ===`);

    console.log(`- Running npm install in ${pkg.dir}`);
    if (dryRun) console.log(`[DRY RUN] Would execute: npm install --no-save --ignore-scripts --no-audit --no-fund in ${pkg.dir}`);
    else runCmd('npm', ['install', '--no-save', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: pkg.dir });

    if (skipTests) {
      console.log(`- Skipping npm test for ${pkg.name}`);
    } else {
      const pkgJson = JSON.parse(readFileSync(join(pkg.dir, 'package.json'), 'utf8'));
      const testScript = pkgJson.scripts && pkgJson.scripts['test:ci'] ? 'test:ci' : 'test';

      console.log(`- Running npm run ${testScript} in ${pkg.dir}`);
      if (dryRun) console.log(`[DRY RUN] Would execute: npm run ${testScript} in ${pkg.dir}`);
      else runCmd('npm', ['run', testScript], { cwd: pkg.dir });
    }
  }

  console.log('\n--- Proceeding to publish ---');

  for (const pkgName of sortedPackages) {
    const pkg = graph[pkgName];
    console.log(`\n=== Publishing ${pkg.name} (${pkg.version}) ===`);

    console.log(`- Running publish:package in ${pkg.dir}`);
    if (dryRun) console.log(`[DRY RUN] Would execute: npm run publish:package in ${pkg.dir}`);
    else runCmd('npm', ['run', 'publish:package'], { cwd: pkg.dir });
  }

  console.log('\nAll packages published successfully.');
}

// Only run the publish script if this file is executed directly.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runPublish(process.argv.slice(2)).catch(err => {
    console.error(err.message || err);
    process.exit(1);
  });
}
