import { defineConfig } from 'vite';
import vue2 from '@vitejs/plugin-vue2';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue2(),
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.vue'],
      outDir: 'dist',
      rollupTypes: true,
      strictOutput: false,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'A2UIVue2',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['vue', '@a2ui/lit', '@a2ui/lit/0.8'],
      output: {
        globals: {
          vue: 'Vue',
        },
      },
    },
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
