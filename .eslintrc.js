module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    // 移除 project 配置以避免测试文件的路径问题
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es6: true,
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    '**/dist/',
    'coverage/',
    '*.config.js',
    '*.config.ts',
  ],
  rules: {
    // 变量相关 - 放宽限制
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn', // 从 error 改为 warn

    // 函数返回类型 - 放宽
    '@typescript-eslint/explicit-function-return-type': 'off', // 关闭强制要求
    '@typescript-eslint/explicit-module-boundary-types': 'off',

    // Promise 和异步相关 - 从 warn 改为 off
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/await-thenable': 'off',
    '@typescript-eslint/no-misused-promises': 'off',

    // 类型安全 - 放宽
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',

    // 其他放宽的规则
    '@typescript-eslint/prefer-readonly': 'off',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off', // 允许 non-null assertion
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/ban-types': 'off', // 允许 {} 类型
    '@typescript-eslint/no-inferrable-types': 'off', // 允许显式类型标注
    '@typescript-eslint/no-empty-function': 'off', // 允许空函数

    // 控制台输出 - 适度放宽
    'no-console': 'off', // 开发中允许 console

    // 通用 JavaScript 规则
    'no-debugger': 'warn',
    'no-empty': 'warn',
    'no-constant-condition': 'off', // 允许常量条件（例如 while(true)）
    'no-case-declarations': 'off', // 允许 case 中的声明
    'no-control-regex': 'off', // 允许正则中的控制字符
    'no-useless-escape': 'warn',
    'prefer-const': 'warn', // 从 error 改为 warn
    'require-yield': 'off', // 允许没有 yield 的 generator
  },
  overrides: [
    {
      // 测试文件完全放宽
      files: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.tsx', '**/*.test.tsx', '**/*.spec.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        'no-debugger': 'off',
        'prefer-const': 'off',
      },
    },
  ],
};