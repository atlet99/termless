import nodePlugin from 'eslint-plugin-n'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/node',
    files: ['apps/api/**/*.ts', 'packages/worker/**/*.ts', 'packages/auth/**/*.ts'],
    plugins: { n: nodePlugin },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      'n/no-missing-import':         'off',
      'n/no-unpublished-import':     'off',
      'n/no-extraneous-import':      'error',
      'n/no-deprecated-api':         'error',
      'n/prefer-global/buffer':      ['error', 'never'],
      'n/prefer-global/process':     ['error', 'never'],
      'n/prefer-promises/fs':        'error',
      'n/prefer-promises/readline':  'error',
      'n/no-callback-literal':       'error',
      'n/prefer-node-protocol': 'error',
    },
  },
  {
    name: 'termless/node-scripts',
    files: ['**/scripts/**/*.ts', '**/seed.ts', '**/export-spec.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
])
