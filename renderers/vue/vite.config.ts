/*
 Copyright 2025 Google LLC

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isLib = mode === 'lib';
  const projectRoot = __dirname;

  return {
    plugins: [
      vue(
          {
              template: {
                  compilerOptions: {
                      // Treat all tags with a dash as custom elements
                      isCustomElement: (tag) => tag.includes('a2ui-')
                  }
              }
          }
      ),
      ...(isLib
        ? [dts({
            rollupTypes: true,
            exclude: ['src/examples/**', 'node_modules/**']
          })]
        : []),
    ],
    root: isLib ? '.' : resolve(projectRoot, 'src/examples'),
    build: isLib
      ? {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'A2UIVue',
            formats: ['es', 'cjs'],
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'js'}`,
          },
          rollupOptions: {
            external: ['vue', '@a2ui/web_core'],
            output: {
              globals: {
                vue: 'Vue',
                '@a2ui/web_core': 'A2UIWebCore'
              },
            },
          }
        }
      : {
          outDir: resolve(__dirname, 'dist-examples'),
        },
    resolve: {
      alias: {
        '@': resolve(projectRoot, 'src')
      },
    },
    server: {
      port: 5173,
      open: true,
    },
  };
});
