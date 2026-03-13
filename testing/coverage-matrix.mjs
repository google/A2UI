#!/usr/bin/env node
/**
 * A2UI Cross-Renderer Component Coverage Matrix
 * 
 * Introspects Lit and Angular renderer sources to find registered component types,
 * compares against v0.10 spec, and outputs a coverage matrix.
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '../..');

// 1. Get spec components from standard_catalog.json
const catalog = JSON.parse(readFileSync(join(repoRoot, 'specification/v0_10/json/standard_catalog.json'), 'utf8'));
const specComponents = Object.keys(catalog.components).sort();

// 2. Get Lit components by scanning case statements in root.ts
const litRoot = readFileSync(join(repoRoot, 'renderers/lit/src/0.8/ui/root.ts'), 'utf8');
const litComponents = [...litRoot.matchAll(/case "(\w+)":/g)].map(m => m[1]).sort();

// 3. Get Angular components from DEFAULT_CATALOG keys in default.ts
const angularDefault = readFileSync(join(repoRoot, 'renderers/angular/src/lib/catalog/default.ts'), 'utf8');
const angularComponents = [...angularDefault.matchAll(/^\s+(\w+):/gm)]
  .map(m => m[1])
  .filter(name => !['type', 'bindings', 'https', 'http', 'import', 'return', 'const', 'export'].includes(name) && /^[A-Z]/.test(name))
  .sort();

// 4. Build and display matrix
console.log('\n╔══════════════════╦═════════╦═════════╦═══════════╦═════════╗');
console.log('║ Component        ║ v0.10   ║ Lit     ║ Angular   ║ Parity  ║');
console.log('╠══════════════════╬═════════╬═════════╬═══════════╬═════════╣');

const allComponents = [...new Set([...specComponents, ...litComponents, ...angularComponents])].sort();
let missingFromSpec = [];
let failures = [];

for (const comp of allComponents) {
  const inSpec = specComponents.includes(comp);
  const inLit = litComponents.includes(comp);
  const inAngular = angularComponents.includes(comp);
  
  // Check for rename: MultipleChoice (renderers) → ChoicePicker (spec)
  const isRenamed = comp === 'MultipleChoice' || comp === 'ChoicePicker';
  
  let parity;
  if (comp === 'ChoicePicker') {
    // Spec has ChoicePicker, renderers have MultipleChoice
    const litHasMC = litComponents.includes('MultipleChoice');
    const angHasMC = angularComponents.includes('MultipleChoice');
    parity = litHasMC && angHasMC ? '⚠️ renamed' : '❌';
  } else if (comp === 'MultipleChoice') {
    parity = '⚠️ v0.8 name';
  } else {
    parity = (inSpec && inLit && inAngular) ? '✅' : '❌';
  }
  
  if (inSpec && (!inLit || !inAngular) && comp !== 'ChoicePicker') {
    failures.push(comp);
  }

  const pad = (s, n) => s.padEnd(n);
  const mark = (b) => b ? '  ✅   ' : '  ❌   ';
  
  console.log(`║ ${pad(comp, 16)} ║${mark(inSpec)}║${mark(inLit)}║  ${inAngular ? '✅' : '❌'}      ║ ${pad(parity, 7)} ║`);
}

console.log('╚══════════════════╩═════════╩═════════╩═══════════╩═════════╝');

// Summary
console.log(`\nSpec components (v0.10): ${specComponents.length}`);
console.log(`Lit components:          ${litComponents.length}`);
console.log(`Angular components:      ${angularComponents.length}`);

console.log('\n--- Naming Differences ---');
console.log('v0.10 "ChoicePicker" = v0.8 "MultipleChoice" (both renderers use v0.8 name)');

// Check for spec components missing from renderers (accounting for rename)
const specMinusRename = specComponents.filter(c => c !== 'ChoicePicker');
const litMinusRename = litComponents.map(c => c === 'MultipleChoice' ? 'ChoicePicker' : c);
const angMinusRename = angularComponents.map(c => c === 'MultipleChoice' ? 'ChoicePicker' : c);

const missingLit = specMinusRename.filter(c => !litMinusRename.includes(c));
const missingAngular = specMinusRename.filter(c => !angMinusRename.includes(c));

if (missingLit.length) console.log(`\n❌ Missing from Lit: ${missingLit.join(', ')}`);
if (missingAngular.length) console.log(`❌ Missing from Angular: ${missingAngular.join(', ')}`);

if (missingLit.length || missingAngular.length) {
  console.log('\n❌ FAIL: Not all spec components covered by renderers');
  process.exit(1);
} else {
  console.log('\n✅ PASS: All spec components covered (with ChoicePicker/MultipleChoice rename noted)');
  process.exit(0);
}
