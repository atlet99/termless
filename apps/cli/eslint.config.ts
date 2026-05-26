/* eslint-disable @typescript-eslint/naming-convention */
import { baseConfig } from '@termless/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  {
    name: 'termless/cli-overrides',
    rules: {
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-useless-default-assignment': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/array-type': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'unicorn/no-await-expression-member': 'off',
      'unicorn/no-unreadable-array-destructuring': 'off',
      'import-x/no-extraneous-dependencies': 'off',
    },
  },
])
