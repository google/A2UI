import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../../../specification/0.8/json');
const destDir = path.resolve(__dirname, '../src/0.8/schemas');

console.log(`Copying schemas from ${srcDir} to ${destDir}...`);

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

try {
  const files = fs.readdirSync(srcDir);
  let count = 0;
  for (const file of files) {
    if (file.endsWith('.json')) {
      const srcFile = path.join(srcDir, file);
      const destFile = path.join(destDir, file);
      fs.copyFileSync(srcFile, destFile);
      count++;
    }
  }
  console.log(`Successfully copied ${count} schema files.`);
} catch (err) {
  console.error('Error copying schemas:', err);
  process.exit(1);
}
