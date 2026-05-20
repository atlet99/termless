import { defineConfig } from 'eslint/config'
import { baseConfig, reactConfig, vitestConfig, securityConfig } from '@termless/eslint-config'
import unicorn from 'eslint-plugin-unicorn'
import n from 'eslint-plugin-n'

export default defineConfig([
  ...baseConfig,
  ...reactConfig,
  ...vitestConfig,
  ...securityConfig,
  {
    name: 'termless/dashboard-overrides',
    files: ['src/**/*.{ts,tsx}'],
    plugins: { unicorn },
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
    plugins: { n, unicorn },
    rules: {
      'n/prefer-node-protocol': 'error',
      'unicorn/prefer-module': 'off',
    },
  },
])
