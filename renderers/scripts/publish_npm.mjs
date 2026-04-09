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

import { getPackageGraph, runCommand } from './lib/workspace.mjs';

const args = process.argv.slice(2);
let packagesToPublish = [];
let force = false;

for (const arg of args) {
  if (arg.startsWith('--packages=')) {
    packagesToPublish = arg.split('=')[1].split(',');
  } else if (arg === '--force') {
    force = true;
  }
}

if (packagesToPublish.length === 0) {
  console.error('Usage: publish_npm --packages=pkg1,pkg2 [--force]');
  process.exit(1);
}

const graph = getPackageGraph();

// Resolve short names to full names
const resolvedPackages = packagesToPublish.map(name => {
  if (graph[name]) return name;
  const pkg = Object.values(graph).find(p => p.name.endsWith('/' + name));
  if (!pkg) {
    console.error(`Package "${name}" not found in workspace.`);
    process.exit(1);
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
  process.exit(1);
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

console.log('--- Authenticating with Google Artifact Registry ---');
runCommand('npx', ['google-artifactregistry-auth']);

for (const pkgName of sortedPackages) {
  const pkg = graph[pkgName];
  console.log(`\n=== Publishing ${pkg.name} (${pkg.version}) ===`);
  
  console.log(`- Running npm install in ${pkg.dir}`);
  runCommand('npm', ['install', '--no-audit', '--no-fund'], { cwd: pkg.dir });
  
  console.log(`- Running npm test in ${pkg.dir}`);
  runCommand('npm', ['test'], { cwd: pkg.dir });
  
  console.log(`- Running publish:package in ${pkg.dir}`);
  runCommand('npm', ['run', 'publish:package'], { cwd: pkg.dir });
}

console.log('\nAll packages published successfully.');
