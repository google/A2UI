import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for A2UI visual parity tests.
 *
 * These tests compare screenshots of the same components rendered by
 * both React and Lit renderers to ensure visual consistency.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['html', { open: 'never' }],
    ['list'],
  ],

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
    },
  ],

  // Start both React and Lit dev servers
  webServer: [
    {
      command: 'npm run dev:react',
      url: 'http://localhost:5001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'npm run dev:lit',
      url: 'http://localhost:5002',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],

  expect: {
    toHaveScreenshot: {
      // Strict by default - individual tests override as needed
      maxDiffPixels: 0,
      threshold: 0.1,
    },
  },
});
