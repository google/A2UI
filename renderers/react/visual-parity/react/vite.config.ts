import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'react',
  server: {
    port: 5001,
    strictPort: true,
  },
  optimizeDeps: {
    exclude: ['@a2ui/react', '@a2ui/lit'],
  },
  resolve: {
    alias: {
      // Dedupe React to avoid "Invalid hook call" errors with linked packages
      react: path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
  },
});
