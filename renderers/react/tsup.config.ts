import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: {
    compilerOptions: {
      jsx: 'react-jsx',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
    },
  },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  external: ['react', 'react-dom'],
  treeshake: true,
  splitting: false,
  // Bundle react-markdown since it's a direct dependency
  noExternal: ['react-markdown'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
    // Define process.env for browser compatibility (react-markdown uses it for SSR detection)
    options.define = {
      ...options.define,
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': JSON.stringify({}),
    }
  },
  platform: 'browser',
})
