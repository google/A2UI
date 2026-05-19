import {defineConfig} from 'vite';

export default defineConfig({
  resolve: {
    dedupe: ['lit'],
  },
  build: {
    target: 'esnext',
  },
  server: {
    port: 5173,
  }
});
