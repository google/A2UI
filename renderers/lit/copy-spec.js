import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.resolve(__dirname, '../../specification/0.8/json');
const destDir = path.resolve(__dirname, 'src/0.8/schemas');

console.log(`Copying specs from ${srcDir} to ${destDir}...`);

// Ensure destination directory exists
if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

// Get all JSON files from source directory
try {
    const files = fs.readdirSync(srcDir).filter(file => file.endsWith('.json'));

    if (files.length === 0) {
        console.warn('No JSON files found in source directory.');
    }

    // Copy each file
    files.forEach(file => {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file}`);
    });
    
    console.log('Copy complete.');
} catch (err) {
    console.error('Error copying files:', err);
    process.exit(1);
}
