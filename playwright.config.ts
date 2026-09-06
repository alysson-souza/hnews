import { defineConfig, devices } from '@playwright/test';

// Defaults to `ng serve`, matching CI. Under parallel load `wrangler pages dev`
// intermittently 404s the app shell (/index.html), which boots a page with no
// app on it and fails whatever test drew it - a different one each run. CI hit
// the same instability harder (workerd dying mid-suite) and already moved off
// wrangler for E2E. Nothing is lost: cloudflare-pages-offline.spec.ts serves
// dist/hnews-cf from its own Node server, so Pages behaviour stays covered.
// To run against wrangler anyway: PLAYWRIGHT_BASE_URL=http://localhost:8788
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:4200';
const defaultWebServerCommand =
  new URL(baseURL).port === '4200' ? 'npm run start:gh' : 'npm run start:cf:offline';

export default defineConfig({
  testDir: './e2e/tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_WEBSERVER_COMMAND ?? defaultWebServerCommand,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
