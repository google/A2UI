import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        shell: resolve(__dirname, 'index.html'),
      },
    },
    target: 'esnext',
  },
  server: {
    port: 5173,
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
});
