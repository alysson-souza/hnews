import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['functions/__tests__/**/*.spec.ts'],
    environment: 'node',
  },
});
