import { defineConfig } from 'eslint/config'
import { baseConfig, nodeConfig, reactConfig, vitestConfig, securityConfig } from '@termless/eslint-config'

export default defineConfig([
  {
    name: 'termless/root-ignores',
    ignores: [
      'dist/**',
      '.turbo/**',
      'node_modules/**',
      'coverage/**',
      '**/*.d.ts',
      'prisma/migrations/**',
      'apps/dashboard/src/routeTree.gen.ts',
    ],
  },
  ...baseConfig,
  ...nodeConfig,
  ...reactConfig,
  ...vitestConfig,
  ...securityConfig,
  {
    name: 'termless/root-configs',
    files: ['*.ts', '*.mts', 'makefiles/**', 'scripts/**/*.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      'unicorn/no-process-exit': 'off',
    },
  },
])
