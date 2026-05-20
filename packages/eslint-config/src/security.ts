import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/security',
    files: ['**/*.{ts,js}'],
    rules: {
      'no-eval':                    'error',
      'no-new-func':                'error',
      'no-implied-eval':            'error',
      'no-script-url':              'error',
      'unicorn/no-process-exit':    'error',
      'unicorn/better-regex':       'error',
      'unicorn/no-unsafe-regex':    'error',
      'no-prototype-builtins':      'error',
      'unicorn/no-static-only-class': 'error',
      'sonarjs/pseudo-random':      'error',
    },
  },
  {
    name: 'termless/auth-strict',
    files: ['packages/auth/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any':        'error',
      '@typescript-eslint/no-unsafe-assignment':    'error',
      'no-console':                                 'error',
      'no-secrets/no-secrets':                      'error',
      '@typescript-eslint/no-floating-promises':    'error',
      '@typescript-eslint/promise-function-async':  'error',
    },
  },
  {
    name: 'termless/worker-strict',
    files: ['packages/worker/**/*.ts'],
    rules: {
      'unicorn/prefer-child-process-exec-file': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
])
