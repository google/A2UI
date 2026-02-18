import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
  resolve: {
    dedupe: ['lit'],
    alias: {
      '@a2ui/web_core/v0_9': path.resolve(__dirname, '../../../../renderers/web_core/src/v0_9/index.ts'),
      '@a2ui/lit/v0_9': path.resolve(__dirname, '../../../../renderers/lit/src/v0_9/index.ts')
    }
  },
  build: {
    target: 'es2020'
  },
  esbuild: {
    target: 'es2020'
  }
})
