import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 4175,
    strictPort: true,
    proxy: { '/api': { target: loadEnv(mode, process.cwd(), 'DEV_').DEV_API_TARGET || 'http://127.0.0.1:4000' } }
  },
  preview: { port: 4175 },
  test: { include: ['src/**/*.{test,spec}.{ts,tsx}'], environment: 'jsdom', setupFiles: './src/test-setup.ts' }
}))

