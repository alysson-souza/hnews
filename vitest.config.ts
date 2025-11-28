import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['src/test-setup.ts'],
    // Use isolated test environment per file to avoid localStorage race conditions
    isolate: true,
    // Run tests in a single thread to avoid parallel localStorage access issues
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
