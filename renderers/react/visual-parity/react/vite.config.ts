import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'react',
  server: {
    port: 5001,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['@a2ui/react', '@a2ui/lit', 'markdown-it'],
  },
});
