/* eslint-disable @typescript-eslint/naming-convention */
import { baseConfig, nodeConfig, securityConfig } from '@termless/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  ...nodeConfig,
  ...securityConfig,
  {
    name: 'termless/api-overrides',
    files: ['src/**/*.ts'],
    rules: {
      'import-x/no-extraneous-dependencies': 'off',
      'import-x/order': 'off',
      'import-x/no-duplicates': 'off',
      'unicorn/no-process-exit': 'off',
      'unicorn/catch-error-name': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/require-await': 'off',
      'unicorn/no-lonely-if': 'off',
      'sonarjs/pseudo-random': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      'unicorn/numeric-separators-style': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'objectLiteralProperty', format: ['camelCase', 'snake_case', 'UPPER_CASE'] },
      ],
    },
  },
  {
    name: 'termless/api-ignore-prisma',
    ignores: ['../../prisma/**'],
  },
])
