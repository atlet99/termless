import { baseConfig, nodeConfig, securityConfig } from '@termless/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  ...nodeConfig,
  // vitestConfig temporarily disabled - waiting for eslint-plugin-vitest to support typescript-eslint v8
  ...securityConfig,
  {
    name: 'termless/worker-overrides',
    files: ['**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      'sonarjs/no-os-command-from-path': 'off',
    },
  },
  {
    name: 'termless/worker-naming',
    files: ['**/*.ts'],
    rules: {
      'unicorn/prevent-abbreviations': [
        'error',
        {
          replacements: {
            args: { args: false },
            err: { error: false },
          },
          checkFilenames: false,
        },
      ],
    },
  },
  {
    name: 'termless/eslint-config',
    files: ['**/eslint.config.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
])
