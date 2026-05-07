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
      name: 'serve-sandbox',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.includes(`/${SANDBOX_BASE_PATH}`)) {
            // Route requests under shared/mcp_apps_inner_iframe to samples/client/shared/
            const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
            let targetPath = pathname.slice(1);
            
            // Normalize script compiled targets back to ts source
            if (targetPath.endsWith('.js')) {
              targetPath = targetPath.slice(0, -3) + '.ts';
            }
            
            // Resolve relative to samples/client
            req.url = '/@fs' + resolve(__dirname, '../../' + targetPath);
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
