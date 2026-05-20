import { defineConfig } from 'eslint/config'
import { baseConfig, reactConfig, vitestConfig, securityConfig } from '@termless/eslint-config'

export default defineConfig([
  ...baseConfig,
  ...reactConfig,
  ...vitestConfig,
  ...securityConfig,
  {
    name: 'termless/dashboard-overrides',
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'unicorn/no-this-assignment': 'off',
      'unicorn/filename-case': ['error', {
        cases: {
          kebabCase: true,
          pascalCase: true,
        },
        ignore: [
          /^__root/,
          /\$[a-zA-Z]+\.tsx$/,
        ],
      }],
    },
  },
  {
    name: 'termless/dashboard-vite-config',
    files: ['vite.config.ts', 'vitest.config.ts'],
    rules: {
      'n/prefer-node-protocol': 'error',
      'unicorn/prefer-module': 'off',
    },
  },
])
