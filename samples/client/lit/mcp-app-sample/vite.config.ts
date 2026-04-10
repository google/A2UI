import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';
import { plugin as a2aPlugin } from './middleware/a2a';
import { SANDBOX_BASE_PATH } from "./ui/shared-constants.js";

export default defineConfig({
  plugins: [
    a2aPlugin(),
    {
      name: 'serve-sandbox',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url?.startsWith(`/${SANDBOX_BASE_PATH}`)) {
            let urlPath = req.url.slice(1);
            if (urlPath.endsWith('.js') && !urlPath.endsWith('app-bridge.js') && !urlPath.endsWith('app-with-deps.js')) {
              urlPath = urlPath.slice(0, -3) + '.ts';
            }
            req.url = '/@fs' + resolve(__dirname, '../../' + urlPath);
          }
          next();
        });
      }
    }
  ],
  build: {
    target: 'esnext',
  },
  resolve: {
    dedupe: ['lit'],
    alias: {
      "sandbox.js": "../../shared/mcp_apps_inner_iframe/sandbox.ts"
    }
  },
  server: {
    host: '0.0.0.0',
    fs: {
      allow: [
        resolve(__dirname, '.'),
        resolve(__dirname, '../node_modules'),
        resolve(__dirname, '../../shared'),
        resolve(__dirname, '../../../../renderers/lit')
      ]
    }
  }
});
