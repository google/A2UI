import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

const srcDir = path.resolve('../../specification/0.8/json/');
const destDir = path.resolve('src/0.8/schemas/');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

const files = await glob('*.json', { cwd: srcDir });

for (const file of files) {
  fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
  console.log(`Copied ${file} to ${destDir}`);
}
