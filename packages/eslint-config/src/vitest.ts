import vitestPlugin from 'eslint-plugin-vitest'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/vitest',
    files: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.ts'],
    plugins: { vitest: vitestPlugin },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'vitest/no-disabled-tests':       'warn',
      'vitest/no-focused-tests':        'error',
      'vitest/no-identical-title':      'error',
      'vitest/prefer-to-be':            'error',
      'vitest/prefer-to-have-length':   'error',
      'vitest/valid-expect':            'error',
      'vitest/consistent-test-it':      ['error', { fn: 'it' }],
      'vitest/require-top-level-describe': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any':       'off',
      'unicorn/no-null':                           'off',
      'sonarjs/no-duplicate-string':               'off',
      'no-secrets/no-secrets':                     'off',
    },
  },
])
