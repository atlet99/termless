import { defineConfig } from 'eslint/config'
import { baseConfig, nodeConfig, vitestConfig, securityConfig } from '@termless/eslint-config'

export default defineConfig([
  ...baseConfig,
  ...nodeConfig,
  ...vitestConfig,
  ...securityConfig,
])
