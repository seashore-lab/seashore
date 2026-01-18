import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const rootDir = resolve(__dirname);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['packages/**/__tests__/**/*.test.ts', 'packages/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', '**/node_modules/**'],
    globalSetup: ['./packages/storage/__tests__/setup/global-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/**/src/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.d.ts', '**/index.ts'],
      thresholds: {
        statements: 20,
        branches: 20,
        functions: 20,
        lines: 20,
      },
    },
    testTimeout: 30000,
    hookTimeout: 120000,
    typecheck: {
      enabled: true,
      tsconfig: './tsconfig.json',
    },
  },
  resolve: {
    alias: {
      '@seashorelab/llm': resolve(rootDir, 'packages/llm/src'),
      '@seashorelab/tool': resolve(rootDir, 'packages/tool/src'),
      '@seashorelab/agent': resolve(rootDir, 'packages/agent/src'),
      '@seashorelab/storage': resolve(rootDir, 'packages/storage/src'),
      '@seashorelab/vectordb': resolve(rootDir, 'packages/vectordb/src'),
      '@seashorelab/rag': resolve(rootDir, 'packages/rag/src'),
      '@seashorelab/workflow': resolve(rootDir, 'packages/workflow/src'),
      '@seashorelab/memory': resolve(rootDir, 'packages/memory/src'),
      '@seashorelab/mcp': resolve(rootDir, 'packages/mcp/src'),
      '@seashorelab/genui': resolve(rootDir, 'packages/genui/src'),
      '@seashorelab/observability': resolve(rootDir, 'packages/observability/src'),
      '@seashorelab/evaluation': resolve(rootDir, 'packages/evaluation/src'),
      '@seashorelab/security': resolve(rootDir, 'packages/security/src'),
      '@seashorelab/deploy': resolve(rootDir, 'packages/deploy/src'),
      '@seashorelab/contextengineering': resolve(rootDir, 'packages/contextengineering/src'),
    },
  },
});
