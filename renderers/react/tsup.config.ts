import { defineConfig } from 'tsup';

export default defineConfig([
  // Main entry with DTS
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    splitting: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    external: ['react', 'react-dom', 'markdown-it'],
    esbuildOptions(options) {
      options.jsx = 'automatic';
    },
  },
  // Styles entry without DTS (avoids symlink resolution issues)
  {
    entry: { 'styles/index': 'src/styles/index.ts' },
    format: ['esm', 'cjs'],
    dts: false,
    splitting: false,
    sourcemap: true,
    clean: false,
    treeshake: true,
    external: ['@a2ui/lit'],
  },
]);
