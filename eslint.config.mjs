import eslint from '@eslint/js';
import globals from 'globals';
import playwright from 'eslint-plugin-playwright';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

export default [
  {
    ignores: [
      'node_modules/**',
      'playwright-report/**',
      'extent-report/**',
      'test-results/**',
      '.playwright-mcp/**',
    ],
  },
  eslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      globals: globals.node,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
      playwright,
    },
    rules: {
      ...typescriptEslint.configs.recommended.rules,
      ...playwright.configs['flat/recommended'].rules,
      '@typescript-eslint/no-floating-promises': 'error',
      'playwright/missing-playwright-await': 'error',
      'playwright/no-wait-for-timeout': 'error',
    },
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.node,
      sourceType: 'module',
    },
  },
];
