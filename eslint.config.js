import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const browserApiRestrictions = [
  { name: 'localStorage', message: 'Browser storage belongs in platform/storage.' },
  { name: 'sessionStorage', message: 'Browser storage belongs in platform/storage.' },
];

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
      'fixtures/**',
      'specs/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { react, 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      'react/prop-types': 'off',
      'no-restricted-globals': ['error', ...browserApiRestrictions],
    },
  },
  {
    files: ['src/platform/**/*.{ts,tsx}'],
    rules: { 'no-restricted-globals': 'off' },
  },
  {
    files: ['src/domain/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                '**/ui/**',
                '**/features/**',
                '**/app/**',
                '**/platform/**',
              ],
              message: 'Domain code must remain pure and dependency-free.',
            },
          ],
        },
      ],
      'no-restricted-globals': ['error', ...browserApiRestrictions, 'window', 'document', 'crypto'],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Inject time into domain functions.',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'Inject randomness into domain functions.',
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**', '**/app/**', '**/platform/**'],
              message: 'Presentational UI cannot import orchestration or platform code.',
            },
            {
              group: ['**/domain/**'],
              allowTypeImports: true,
              message: 'UI may import domain types only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/atoms/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['src/ui/**', '../**'], message: 'Atoms cannot compose other UI components.' },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/molecules/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../molecules/**', '../organisms/**', '../templates/**'],
              message: 'Molecules may compose atoms only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/organisms/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../organisms/**', '../templates/**'],
              message: 'Organisms may compose atoms and molecules only.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/templates/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../templates/**'],
              message: 'Templates compose organisms and layout slots.',
            },
          ],
        },
      ],
    },
  },
);
