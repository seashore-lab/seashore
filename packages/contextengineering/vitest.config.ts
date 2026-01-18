import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@seashorelab/contextengineering': resolve(__dirname, 'src'),
    },
  },
});
