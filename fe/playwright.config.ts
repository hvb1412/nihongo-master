import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'e2e',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:4175',
    ...(process.env.PLAYWRIGHT_BROWSER_CHANNEL ? { channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL } : {}),
    trace: 'retain-on-failure'
  }
})

