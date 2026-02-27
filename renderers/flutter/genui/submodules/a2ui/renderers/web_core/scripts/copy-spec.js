/**
 * Cross-platform script to copy JSON schemas.
 * Uses Node.js fs/path modules for Windows/Unix compatibility.
 */
import { mkdirSync, cpSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, '..', '..', 'specification', 'v0_8', 'json');
const destDir = join(rootDir, 'src', 'v0_8', 'schemas');

mkdirSync(destDir, { recursive: true });

readdirSync(srcDir)
  .filter(file => file.endsWith('.json'))
  .forEach(file => cpSync(join(srcDir, file), join(destDir, file)));
