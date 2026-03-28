const globals = require('globals');

const nxPlugin = require('@nx/eslint-plugin');

const baseConfig = require('@m-thalmann/eslint-config-base');
const angularConfig = require('@m-thalmann/eslint-config-angular');

const prettierConfig = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['dist/', 'tmp/', 'coverage/', '.nx', '.angular'],
  },

  {
    languageOptions: {
      ecmaVersion: 'latest',
      globals: {
        ...globals.node,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    plugins: { '@nx': nxPlugin },
  },

  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['jest.config.ts'],
          defaultProject: 'tsconfig.base.json',
        },
        tsconfigRootDir: __dirname,
      },
    },
  },

  {
    files: ['*.spec.ts', '*.spec.js'],
    env: {
      jest: true,
    },
    rules: {},
  },

  ...baseConfig,
  ...angularConfig,

  prettierConfig,

  {
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/typedef': [
        'error',
        {
          memberVariableDeclaration: false,
          parameter: true,
          propertyDeclaration: true,
        },
      ],
    },
  },

  {
    files: ['**/*.module.ts', '**/*.component.ts'],
    rules: {
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },

  {
    files: ['./apps/backend/**'],
    rules: {
      '@angular-eslint/prefer-inject': 'off',
    },
  },
];
