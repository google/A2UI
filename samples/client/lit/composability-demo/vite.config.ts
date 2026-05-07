/*
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {UserConfig} from 'vite';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SANDBOX_BASE_PATH = 'shared/mcp_apps_inner_iframe/';
const SANDBOX_ENTRY_NAME = `${SANDBOX_BASE_PATH}sandbox`;

export default {
  plugins: [
    {
      name: 'serve-sandbox-web-and-catalogs',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          const url = req.url || '';
          
          // 1. Intercept and serve shared double-sandbox proxy
          if (url.includes(`/${SANDBOX_BASE_PATH}`)) {
            const pathname = new URL(url, `http://${req.headers.host}`).pathname;
            let targetPath = pathname.slice(1);
            if (targetPath.endsWith('.js')) {
              targetPath = targetPath.slice(0, -3) + '.ts';
            }
            req.url = '/@fs' + resolve(__dirname, '../../' + targetPath);
          }
          
          // 2. Intercept and serve shared dynamic web components
          if (url.startsWith('/web/')) {
            const pathname = new URL(url, `http://${req.headers.host}`).pathname;
            req.url = '/@fs' + resolve(__dirname, '../../../../' + pathname.slice(1));
          }
          
          // 3. Intercept and serve catalogs
          if (url.startsWith('/catalogs/')) {
            const pathname = new URL(url, `http://${req.headers.host}`).pathname;
            req.url = '/@fs' + resolve(__dirname, '../../../../renderers/lit/' + pathname.slice(1));
          }
          
          next();
        });
      }
    }
  ],
  server: {
    port: 8000,
    host: true,
    fs: {
      allow: ['../../../', './']
    }
  },
  resolve: {
    dedupe: ['lit'],
    alias: {
      '@a2ui/markdown-it': resolve(__dirname, '../../../renderers/markdown/markdown-it/dist/src/markdown.js'),
      'sandbox.js': resolve(__dirname, '../../' + SANDBOX_ENTRY_NAME + '.ts')
    }
  }
} satisfies UserConfig;
