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

import nodePlugin from 'eslint-plugin-n'
import globals from 'globals'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/node',
    files: ['apps/api/**/*.ts', 'packages/worker/**/*.ts', 'packages/auth/**/*.ts'],
    plugins: { n: nodePlugin },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      'n/no-missing-import':         'off',
      'n/no-unpublished-import':     'off',
      'n/no-extraneous-import':      'error',
      'n/no-deprecated-api':         'error',
      'n/prefer-global/buffer':      ['error', 'never'],
      'n/prefer-global/process':     ['error', 'never'],
      'n/prefer-promises/fs':        'error',
      'n/prefer-promises/readline':  'error',
      'n/no-callback-literal':       'error',
      'n/prefer-node-protocol': 'error',
    },
  },
  {
    name: 'termless/node-scripts',
    files: ['**/scripts/**/*.ts', '**/seed.ts', '**/export-spec.ts'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
    },
  },
])
