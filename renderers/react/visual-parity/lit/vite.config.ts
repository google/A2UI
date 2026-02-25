import { defineConfig } from 'vite';

export default defineConfig({
  root: 'lit',
  server: {
    port: 5002,
    strictPort: true,
  },
  optimizeDeps: {
    // Don't pre-bundle @a2ui/lit or its deps to avoid duplicate module instances
    exclude: [
      '@a2ui/lit',
      'markdown-it',
      'clsx',
      'signal-utils/array',
      'signal-utils/map',
      'signal-utils/object',
      'signal-utils/set',
    ],
  },
  esbuild: {
    // Enable decorator support
    target: 'es2022',
  },
});
