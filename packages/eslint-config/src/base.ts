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

import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import importX from 'eslint-plugin-import-x'
import unicorn from 'eslint-plugin-unicorn'
import sonarjs from 'eslint-plugin-sonarjs'
import promise from 'eslint-plugin-promise'
import noSecrets from 'eslint-plugin-no-secrets'
import { defineConfig } from 'eslint/config'

export default defineConfig([
  {
    name: 'termless/global-ignores',
    ignores: [
      'dist/**',
      'build/**',
      '.turbo/**',
      'node_modules/**',
      'coverage/**',
      '**/*.d.ts',
      'prisma/migrations/**',
    ],
  },
  {
    name: 'termless/js-base',
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    ...js.configs.recommended,
  },
  {
    name: 'termless/typescript-strict',
    files: ['**/*.{ts,mts,cts}'],
    extends: [
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.ts', 'vite.config.ts'],
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any':           'error',
      '@typescript-eslint/no-unsafe-assignment':       'error',
      '@typescript-eslint/no-unsafe-call':             'error',
      '@typescript-eslint/no-unsafe-member-access':    'error',
      '@typescript-eslint/no-unsafe-return':           'error',
      '@typescript-eslint/no-unsafe-argument':         'error',
      '@typescript-eslint/no-non-null-assertion':      'error',
      '@typescript-eslint/strict-boolean-expressions': ['warn', {
        allowString: false,
        allowNumber: false,
        allowNullableObject: true,
      }],
      '@typescript-eslint/no-floating-promises':       ['error', {
        ignoreIIFE: false,
        ignoreVoid: false,
      }],
      '@typescript-eslint/await-thenable':             'error',
      '@typescript-eslint/no-misused-promises':        ['error', {
        checksVoidReturn: { attributes: false },
      }],
      '@typescript-eslint/require-await':              'error',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^(?!I[A-Z])', match: true },
        },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
        { selector: 'enumMember', format: ['UPPER_CASE', 'PascalCase'] },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE', 'PascalCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        { selector: 'memberLike', format: ['camelCase'], leadingUnderscore: 'allow' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing':  'error',
      '@typescript-eslint/prefer-optional-chain':      'error',
      '@typescript-eslint/no-unnecessary-condition':   'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/consistent-type-imports':    ['error', {
        prefer: 'type-imports',
        fixStyle: 'inline-type-imports',
      }],
      '@typescript-eslint/consistent-type-exports':    ['error', {
        fixMixedExportsWithInlineTypeSpecifier: true,
      }],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      }],
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
      }],
      '@typescript-eslint/no-confusing-void-expression': 'off',
    },
  },
  {
    name: 'termless/imports',
    files: ['**/*.{ts,mts,cts,js,mjs}'],
    plugins: { 'import-x': importX },
    settings: {
      'import-x/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['apps/*/tsconfig.json', 'packages/*/tsconfig.json'],
        },
        node: true,
      },
    },
    rules: {
      'import-x/no-duplicates':           ['error', { 'prefer-inline': true }],
      'import-x/no-cycle':                 'error',
      'import-x/no-self-import':           'error',
      'import-x/no-useless-path-segments': 'error',
      'import-x/no-extraneous-dependencies': ['error', {
        devDependencies: [
          '**/*.test.ts',
          '**/*.spec.ts',
          '**/vitest.config.ts',
          '**/eslint.config.ts',
        ],
      }],
      'import-x/order': ['error', {
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import-x/first':        'error',
      'import-x/newline-after-import': ['error', { count: 1 }],
    },
  },
  {
    name: 'termless/unicorn',
    files: ['**/*.{ts,mts,cts,js,mjs}'],
    ...unicorn.configs.recommended,
    rules: {
      ...unicorn.configs.recommended.rules,
      'unicorn/filename-case': ['error', {
        cases: {
          kebabCase: true,
          pascalCase: true,
        },
        ignore: [
          /^eslint\.config/,
          /^vite\.config/,
          /^vitest\.config/,
          /^tsconfig/,
          /\.(d)\.ts$/,
        ],
      }],
      'unicorn/no-null':                    'off',
      'unicorn/no-process-exit':            'off',
      'unicorn/prefer-module':              'off',
      'unicorn/prevent-abbreviations': ['error', {
        replacements: {
          res: false,
          req: false,
          ctx: false,
          db:  false,
          env: false,
          err: false,
          e:   { error: false },
        },
        checkFilenames: false,
      }],
      'unicorn/no-array-reduce':            'warn',
      'unicorn/prefer-top-level-await':     'off',
      'unicorn/no-negated-condition':       'warn',
    },
  },
  {
    name: 'termless/sonarjs',
    files: ['**/*.{ts,mts,cts,js}'],
    ...sonarjs.configs.recommended,
    rules: {
      ...sonarjs.configs.recommended.rules,
      'sonarjs/cognitive-complexity':    ['error', 15],
      'sonarjs/no-duplicate-string':     ['error', { threshold: 5 }],
      'sonarjs/no-identical-functions':  ['error', 3],
    },
  },
  {
    name: 'termless/promise',
    files: ['**/*.{ts,js}'],
    plugins: { promise },
    rules: {
      'promise/always-return':     'error',
      'promise/no-return-wrap':    'error',
      'promise/param-names':       'error',
      'promise/no-nesting':        'warn',
      'promise/avoid-new':         'off',
      'promise/no-promise-in-callback': 'warn',
    },
  },
  {
    name: 'termless/no-secrets',
    files: ['**/*.{ts,js,mts,mjs}'],
    plugins: { 'no-secrets': noSecrets },
    rules: {
      'no-secrets/no-secrets': ['error', {
        tolerance: 4.2,
        additionalRegexes: {
          'Anthropic API Key': 'sk-ant-[a-zA-Z0-9]{20,}',
          'OpenAI API Key':    'sk-[a-zA-Z0-9]{20,}',
          'JWT Secret':        '(?:jwt|session)[-_]?secret\\s*[:=]\\s*[\'"][^\'"]{16,}',
        },
      }],
    },
  },
])
