import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import obsidian from 'eslint-plugin-obsidian';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      'main.js',
      'test-folder/**',
      'node_modules/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
    },
    plugins: {
      obsidian: obsidian,
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error', 'debug'] }],
      '@typescript-eslint/no-explicit-any': 'error',
      'obsidian/no-raw-text': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    },
  }
);
