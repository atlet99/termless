import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/react',
    files: ['apps/dashboard/**/*.{tsx,ts,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs['jsx-runtime'].rules,
      'react/prop-types':              'off',
      'react/display-name':            'error',
      'react/no-danger':               'error',
      'react/no-array-index-key':      'warn',
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'react/jsx-no-target-blank':     ['error', { enforceDynamicLinks: 'always' }],
      'react-hooks/rules-of-hooks':    'error',
      'react-hooks/exhaustive-deps':   'error',
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/no-autofocus':         'warn',
      '@typescript-eslint/no-misused-promises': ['error', {
        checksVoidReturn: { attributes: false },
      }],
    },
  },
])
