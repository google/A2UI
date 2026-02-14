import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5003,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['@a2ui/react', 'react', 'react-dom'],
  },
});
