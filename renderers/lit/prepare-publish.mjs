import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// This script prepares the Lit package for publishing by:
// 1. Copying package.json to dist/
// 2. Updating @a2ui/web_core dependency from 'file:...' to the actual version
// 3. Adjusting paths in package.json (main, types, exports) to be relative to dist/

const dirname = import.meta.dirname;
const corePkgPath = join(dirname, '../core/package.json');
const litPkgPath = join(dirname, './package.json');
const distDir = join(dirname, './dist');

if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// 1. Get Core Version
const corePkg = JSON.parse(readFileSync(corePkgPath, 'utf8'));
const coreVersion = corePkg.version;
if (!coreVersion) throw new Error('Cannot determine @a2ui/web_core version');

// 2. Read Lit Package
const litPkg = JSON.parse(readFileSync(litPkgPath, 'utf8'));

// 3. Update Dependency
if (litPkg.dependencies && litPkg.dependencies['@a2ui/web_core']) {
  litPkg.dependencies['@a2ui/web_core'] = '^' + coreVersion;
} else {
  console.warn('Warning: @a2ui/web_core not found in dependencies.');
}

// 4. Adjust Paths for Dist
litPkg.main = adjustPath(litPkg.main);
litPkg.types = adjustPath(litPkg.types);

if (litPkg.exports) {
  for (const key in litPkg.exports) {
    const exp = litPkg.exports[key];
    if (typeof exp === 'string') {
      litPkg.exports[key] = adjustPath(exp);
    } else {
      if (exp.types) exp.types = adjustPath(exp.types);
      if (exp.default) exp.default = adjustPath(exp.default);
      if (exp.import) exp.import = adjustPath(exp.import);
      if (exp.require) exp.require = adjustPath(exp.require);
    }
  }
}

// 5. Write to dist/package.json
writeFileSync(join(distDir, 'package.json'), JSON.stringify(litPkg, null, 2));

// 6. Copy README and LICENSE
['README.md', 'LICENSE'].forEach(file => {
  const src = join(dirname, file);
  if (!existsSync(src)) {
    throw new Error(`Missing required file for publishing: ${file}`);
  }
  copyFileSync(src, join(distDir, file));
});

console.log(`Prepared dist/package.json with @a2ui/web_core@${coreVersion}`);

// Utility function to adjustthe paths of the built files (dist/src/*) to (src/*)
function adjustPath(p) {
  if (p && p.startsWith('./dist/')) {
    return './' + p.substring(7); // Remove ./dist/
  }
  return p;
}