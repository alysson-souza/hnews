// @ts-check
const { defineConfig } = require('eslint/config');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');
const eslintPluginPrettier = require('eslint-plugin-prettier/recommended');
const globals = require('globals');

/**
 * @param {import('eslint').Linter.Config[]} configs
 * @param {string[]} files
 * @returns {import('eslint').Linter.Config[]}
 */
const withFiles = (configs, files) =>
  configs.map((config) => ({
    ...config,
    files: config.files ?? [...files],
  }));

module.exports = defineConfig([
  {
    ignores: [
      'node_modules',
      'dist',
      'coverage',
      '.angular',
      'tmp',
      'package-lock.json',
      '**/*.min.*',
      '**/*.log',
      'public/version.json',
      'public/hnews-redirect.user.js',
    ],
  },
  eslint.configs.recommended,
  ...withFiles(/** @type {any[]} */ (tseslint.configs.recommended), ['**/*.ts']),
  ...withFiles(/** @type {any[]} */ (angular.configs.tsRecommended), ['**/*.ts']),
  {
    files: ['**/*.ts'],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'app',
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: 'app',
          style: 'kebab-case',
        },
      ],
    },
  },
  ...withFiles(
    /** @type {any[]} */ ([
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ]),
    ['**/*.html'],
  ),
  {
    files: ['**/*.{js,cjs}'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: globals.node,
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: {
      sourceType: 'module',
      globals: globals.node,
    },
  },
  eslintPluginPrettier,
]);
