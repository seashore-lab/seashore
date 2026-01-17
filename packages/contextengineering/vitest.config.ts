import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const rootDir = resolve(__dirname, '../..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@seashore/contextengineering': resolve(__dirname, 'src'),
    },
  },
});
