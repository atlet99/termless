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

import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/security',
    files: ['**/*.{ts,js}'],
    rules: {
      'no-eval':                    'error',
      'no-new-func':                'error',
      'no-implied-eval':            'error',
      'no-script-url':              'error',
      'unicorn/no-process-exit':    'error',
      'unicorn/better-regex':       'error',
      'unicorn/no-unsafe-regex':    'error',
      'no-prototype-builtins':      'error',
      'unicorn/no-static-only-class': 'error',
      'sonarjs/pseudo-random':      'error',
    },
  },
  {
    name: 'termless/auth-strict',
    files: ['packages/auth/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any':        'error',
      '@typescript-eslint/no-unsafe-assignment':    'error',
      'no-console':                                 'error',
      'no-secrets/no-secrets':                      'error',
      '@typescript-eslint/no-floating-promises':    'error',
      '@typescript-eslint/promise-function-async':  'error',
    },
  },
  {
    name: 'termless/worker-strict',
    files: ['packages/worker/**/*.ts'],
    rules: {
      'unicorn/prefer-child-process-exec-file': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
])
