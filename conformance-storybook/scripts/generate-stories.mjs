#!/usr/bin/env node
/**
 * Build-time story generator.
 * Reads fixture JSON files and generates Storybook CSF3 .stories.ts files.
 * Run before `storybook build`.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const fixturesDir = join(root, "stories", "fixtures");
const outDir = join(root, "stories", "generated");

// Read manifest
const manifest = JSON.parse(readFileSync(join(fixturesDir, "manifest.json"), "utf-8"));

mkdirSync(outDir, { recursive: true });

function sanitizeName(name) {
  // Convert to valid JS identifier: "Primary Button" → "PrimaryButton"
  return name.replace(/[^a-zA-Z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

let totalStories = 0;

for (const entry of manifest.fixtures) {
  const fixture = JSON.parse(readFileSync(join(fixturesDir, entry.file), "utf-8"));
  const category = entry.category;
  const baseName = entry.file.replace(".json", "");

  let code = `// AUTO-GENERATED — do not edit. Run: node scripts/generate-stories.mjs
import type { Meta, StoryObj } from "@storybook/web-components";
import { renderA2UI } from "../helpers/a2ui-story-wrapper.js";
import { translateToV08 } from "../helpers/version-adapter.js";
import type { V010Message } from "../helpers/version-adapter.js";

const meta: Meta = { title: "Generated/${category}" };
export default meta;

`;

  for (const scenario of fixture.scenarios) {
    const exportName = sanitizeName(scenario.name) + "_v08_Lit";
    const messagesJson = JSON.stringify(scenario.messages, null, 2);

    // Determine surface ID for rendering
    let surfaceId = null;
    for (const msg of scenario.messages) {
      if (msg.createSurface) {
        surfaceId = msg.createSurface.surfaceId;
        break;
      }
    }

    code += `const ${sanitizeName(scenario.name)}_messages: V010Message[] = ${messagesJson};\n\n`;
    code += `export const ${exportName}: StoryObj = {\n`;
    code += `  name: "${scenario.name} [v0.8 Lit]",\n`;
    code += `  render: () => renderA2UI(translateToV08(${sanitizeName(scenario.name)}_messages)${surfaceId ? `, "${surfaceId}"` : ""}),\n`;
    code += `};\n\n`;
    totalStories++;
  }

  const outFile = join(outDir, `${baseName}.stories.ts`);
  writeFileSync(outFile, code);
  console.log(`  ✓ ${outFile} (${fixture.scenarios.length} stories)`);
}

console.log(`\nGenerated ${totalStories} stories from ${manifest.fixtures.length} fixture files.`);
