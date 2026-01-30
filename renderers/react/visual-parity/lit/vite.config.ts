import { defineConfig } from 'vite';

export default defineConfig({
  root: 'lit',
  server: {
    port: 5002,
    strictPort: true,
  },
  optimizeDeps: {
    // Don't pre-bundle @a2ui/lit to avoid duplicate module instances
    exclude: ['@a2ui/lit'],
  },
  esbuild: {
    // Enable decorator support
    target: 'es2022',
  },
});
