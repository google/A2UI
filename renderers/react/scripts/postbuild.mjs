import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dist = join(root, 'dist');
const src = join(root, 'src');

// Function to copy a file to both .d.ts and .d.cts
function copyDts(source, destinationDir) {
  const dts = source;
  const targetDts = join(destinationDir, 'index.d.ts');
  const targetDcts = join(destinationDir, 'index.d.cts');
  
  copyFileSync(dts, targetDts);
  copyFileSync(dts, targetDcts);
}

// 1. Copy root styles declaration
copyDts(join(src, 'styles', 'index.d.ts'), join(dist, 'styles'));

// 2. Create v0_8 styles directory in dist
mkdirSync(join(dist, 'v0_8', 'styles'), { recursive: true });

// 3. Copy v0_8 styles declaration
copyDts(join(src, 'v0_8', 'styles', 'index.d.ts'), join(dist, 'v0_8', 'styles'));

console.log('Post-build style declarations copied successfully.');
