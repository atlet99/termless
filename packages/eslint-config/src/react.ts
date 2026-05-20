/**
 * Copyright 2026 Abdurakhman Rakhmankulov
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
