import { baseConfig, nodeConfig, securityConfig } from '@termless/eslint-config'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  ...baseConfig,
  ...nodeConfig,
  // vitestConfig temporarily disabled - waiting for eslint-plugin-vitest to support typescript-eslint v8
  ...securityConfig,
])
