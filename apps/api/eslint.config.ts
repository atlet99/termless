import { defineConfig } from 'eslint/config'
import { baseConfig, nodeConfig, securityConfig } from '@termless/eslint-config'

export default defineConfig([
  ...baseConfig,
  ...nodeConfig,
  // vitestConfig temporarily disabled - waiting for eslint-plugin-vitest to support typescript-eslint v8
  ...securityConfig,
  {
    name: 'termless/api-overrides',
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
    },
  },
  {
    name: 'termless/api-routes',
    files: ['src/routes/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
    },
  },
  {
    name: 'termless/api-ignore-prisma',
    ignores: ['../../prisma/**'],
  },
])
