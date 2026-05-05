const closureCompiler = require('google-closure-compiler');
const Compiler = closureCompiler.compiler;
const compilerInstance = new Compiler({js: 'test.js', js_output_file: 'test-compiled.js'});
compilerInstance.run((exitCode, stdout, stderr) => {
  console.log('Exit Code:', exitCode);
  console.log('Stdout:', stdout);
  console.log('Stderr:', stderr);
});
