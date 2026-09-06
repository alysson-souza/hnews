import { defineConfig } from '@playwright/test';

/**
 * Live API contract checks (e2e/live), run on a schedule rather than per-commit.
 *
 * Deliberately separate from playwright.config.ts: that config's testDir is
 * ./e2e/tests, so these never run in the normal suite. They need no browser and no
 * webServer — they call the upstream APIs directly through the `request` fixture.
 *
 * Retries are generous because a failure here should mean "the API contract
 * changed", not "the network blipped".
 */
export default defineConfig({
  testDir: './live',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 3,
  reporter: process.env.CI ? 'github' : 'list',
  timeout: 30_000,
  use: {
    trace: 'retain-on-failure',
  },
});
