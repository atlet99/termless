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

import vitestPlugin from 'eslint-plugin-vitest'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/vitest',
    files: ['**/*.{test,spec}.{ts,tsx}', '**/tests/**/*.ts'],
    plugins: { vitest: vitestPlugin },
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      'vitest/no-disabled-tests':       'warn',
      'vitest/no-focused-tests':        'error',
      'vitest/no-identical-title':      'error',
      'vitest/prefer-to-be':            'error',
      'vitest/prefer-to-have-length':   'error',
      'vitest/valid-expect':            'error',
      'vitest/consistent-test-it':      ['error', { fn: 'it' }],
      'vitest/require-top-level-describe': 'error',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-explicit-any':       'off',
      'unicorn/no-null':                           'off',
      'sonarjs/no-duplicate-string':               'off',
      'no-secrets/no-secrets':                     'off',
    },
  },
])
