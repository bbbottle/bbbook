import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

const apiPort = process.env.API_PORT ?? '80'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@bbbook/shared-types': resolve(__dirname, '../../packages/shared-types/src/index.ts'),
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      '/kindle': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
})
