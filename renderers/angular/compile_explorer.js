const fs = require('fs');
const path = require('path');
const closureCompiler = require('google-closure-compiler-js');

const inputPath = path.join(__dirname, 'dist/a2ui_explorer/browser/main-N7JESC74.js');
const outputPath = path.join(__dirname, 'dist/a2ui_explorer/browser/main-compiled.js');

console.log('Reading input file...');
const src = fs.readFileSync(inputPath, 'utf8');

console.log('Compiling...');
const flags = {
  jsCode: [{src: src}],
  compilationLevel: 'SIMPLE',
};

const out = closureCompiler(flags);

if (out.errors && out.errors.length > 0) {
  console.error('Compilation errors:');
  out.errors.forEach(err => console.error(err));
  process.exit(1);
}

if (out.warnings && out.warnings.length > 0) {
  console.warn('Compilation warnings:');
  out.warnings.forEach(warn => console.warn(warn));
}

console.log('Writing output file...');
fs.writeFileSync(outputPath, out.compiledCode, 'utf8');
console.log('Done.');
