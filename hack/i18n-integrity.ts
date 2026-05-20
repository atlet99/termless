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

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = join(import.meta.dirname, '..')
const LOCALES_DIR = join(ROOT, 'apps', 'dashboard', 'src', 'i18n', 'locales')

function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...flattenKeys(value as Record<string, unknown>, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function getLocaleFiles(): string[] {
  return readdirSync(LOCALES_DIR).filter((f) => f.endsWith('.json'))
}

function exitError(msg: string): never {
  console.error(`\x1b[1;31m✗\x1b[0m ${msg}`)
  process.exit(1)
}

function main() {
  const files = getLocaleFiles()
  if (files.length < 2) {
    exitError('Need at least 2 locale files to compare')
  }

  const localeKeys = new Map<string, { file: string; keys: Set<string> }>()

  for (const file of files) {
    const content = readFileSync(join(LOCALES_DIR, file), 'utf-8')
    const parsed: Record<string, unknown> = JSON.parse(content)
    const keys = new Set(flattenKeys(parsed))
    const locale = file.replace('.json', '')
    localeKeys.set(locale, { file, keys })
  }

  const locales = [...localeKeys.keys()]
  const base = locales[0]!
  const baseKeys = localeKeys.get(base)!.keys

  let hasErrors = false

  console.log(`\x1b[1;36mℹ\x1b[0m i18n integrity check`)
  console.log(`  Base locale: \x1b[36m${base}\x1b[0m (${baseKeys.size} keys)`)

  for (const locale of locales.slice(1)) {
    const { keys } = localeKeys.get(locale)!
    const missing = [...baseKeys].filter((k) => !keys.has(k))
    const extra = [...keys].filter((k) => !baseKeys.has(k))

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  \x1b[1;32m✓\x1b[0m ${locale}: ${keys.size} keys — OK`)
    } else {
      hasErrors = true
      if (missing.length > 0) {
        console.error(`  \x1b[1;31m✗\x1b[0m ${locale}: missing ${missing.length} keys:`)
        for (const k of missing) {
          console.error(`      - ${k}`)
        }
      }
      if (extra.length > 0) {
        console.error(`  \x1b[1;33m⚠\x1b[0m ${locale}: extra ${extra.length} keys:`)
        for (const k of extra) {
          console.error(`      + ${k}`)
        }
      }
    }
  }

  if (hasErrors) {
    exitError('i18n locale keys are not in sync')
  }

  console.log(`\x1b[1;32m✓\x1b[0m All ${locales.length} locales have identical key sets\n`)
}

main()
