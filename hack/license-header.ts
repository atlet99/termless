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

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execSync } from 'node:child_process'

const ROOT = join(import.meta.dirname, '..')

// ── Comment styles ──────────────────────────────────────────────────────────

type CommentStyle = 'block' | 'hash'

function styleForFile(fileName: string): CommentStyle | null {
  if (fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.css')) return 'block'
  if (fileName.endsWith('.sh') || fileName === 'Makefile' || fileName.endsWith('.mk')) return 'hash'
  return null
}

// ── Build canonical body from LICENSE appendix ──────────────────────────────

const LICENSE_TEXT = readFileSync(join(ROOT, 'LICENSE'), 'utf-8')
const LICENSE_LINES = LICENSE_TEXT.split('\n')

const APPENDIX_MARKER = 'Copyright [yyyy] [name of copyright owner]'
const appendixLineIdx = LICENSE_LINES.findIndex((l) => l.includes(APPENDIX_MARKER))
if (appendixLineIdx === -1) {
  console.error('FATAL: could not find appendix boilerplate in LICENSE')
  process.exit(1)
}

const boilerplateLines = LICENSE_LINES.slice(appendixLineIdx)
  .map((l) => l.trim())
  .filter((l) => l.length > 0)

const COPYRIGHT_LINE = 'Copyright 2026 Abdurakhman Rakhmankulov'
const CANONICAL_BODY = [COPYRIGHT_LINE, '', ...boilerplateLines.slice(1)].join('\n')
const NORMALIZED_BODY = CANONICAL_BODY.split('\n').map((l) => l.trim()).filter((l) => l.length > 0).join('\n')

function buildHeader(style: CommentStyle): string {
  if (style === 'block') {
    return '/**\n' +
      CANONICAL_BODY
        .split('\n')
        .map((l) => (' * ' + l).trimEnd())
        .join('\n') +
      '\n */'
  }
  return CANONICAL_BODY
    .split('\n')
    .map((l) => ('# ' + l).trimEnd())
    .join('\n')
}

// ── Header extraction & comparison ──────────────────────────────────────────

const BLOCK_COMMENT_RE = /^\/\*\*[\s\S]*?\*\/\n*/

const HASH_HEADER_RE = /^(#[^\n]*\n)+/

function extractHeader(content: string, style: CommentStyle): string | null {
  if (style === 'block') {
    const m = content.match(BLOCK_COMMENT_RE)
    return m ? m[0] : null
  }
  const m = content.match(HASH_HEADER_RE)
  if (!m) return null
  return m[0]
}

function normalizeBody(raw: string): string {
  return raw
    .replace(/\/\*\*?\s*/, '')
    .replace(/\s*\*\//, '')
    .split('\n')
    .map((l) => l.replace(/^\s*\*\s?/, '').replace(/^#\s?/, '').trim())
    .filter((l) => l.length > 0)
    .join('\n')
}

function headersMatch(existing: string, style: CommentStyle): boolean {
  return normalizeBody(existing) === NORMALIZED_BODY
}

function stripHeader(content: string, style: CommentStyle): string {
  if (style === 'block') {
    return content.replace(BLOCK_COMMENT_RE, '').replace(/^\n+/, '')
  }
  return content.replace(HASH_HEADER_RE, '').replace(/^\n+/, '')
}

// ── .gitignore aware file walker ────────────────────────────────────────────

function parseGitignore(filePath: string): string[] {
  try {
    return readFileSync(filePath, 'utf-8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'))
  } catch {
    return []
  }
}

function getGlobalGitignorePatterns(): string[] {
  try {
    const raw = execSync('git config --get core.excludesFile 2>/dev/null || true', {
      encoding: 'utf-8',
    }).trim()
    if (!raw) return []
    return parseGitignore(raw.replace(/^~/, process.env.HOME ?? '~'))
  } catch {
    return []
  }
}

const ignorePatterns = [
  ...parseGitignore(join(ROOT, '.gitignore')),
  ...getGlobalGitignorePatterns(),
]

const SKIP_DIRS = new Set([
  'node_modules', 'dist', '.turbo', '.git', 'coverage',
  'backups', 'test_results', 'prisma',
])

const SKIP_FILES = new Set(['.DS_Store', 'Thumbs.db', 'eslint.config.ts'])

function isIgnored(relPath: string): boolean {
  const parts = relPath.split('/')
  const fileName = parts[parts.length - 1] ?? ''
  for (const p of ignorePatterns) {
    if (p.startsWith('*.')) {
      if (fileName.endsWith(p.slice(1))) return true
    } else if (p.endsWith('/')) {
      if (parts.some((s) => s === p.slice(0, -1))) return true
    } else if (p.includes('*')) {
      const re = new RegExp('^' + p.replace(/\*/g, '.*') + '$')
      if (re.test(fileName) || re.test(relPath)) return true
    } else {
      if (relPath === p || parts.some((s) => s === p)) return true
    }
  }
  return false
}

function shouldProcess(name: string): boolean {
  return styleForFile(name) !== null
}

function walkDir(dir: string, root: string): string[] {
  const out: string[] = []
  let entries: string[]
  try { entries = readdirSync(dir) } catch { return out }

  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue
    const full = join(dir, name)
    let st: ReturnType<typeof statSync>
    try { st = statSync(full) } catch { continue }
    if (st.isDirectory()) {
      out.push(...walkDir(full, root))
    } else if (st.isFile() && shouldProcess(name) && !SKIP_FILES.has(name)) {
      const rel = relative(root, full)
      if (!isIgnored(rel)) out.push(full)
    }
  }
  return out
}

// ── Main ────────────────────────────────────────────────────────────────────

type FileAction = 'ok' | 'added' | 'fixed' | 'missing' | 'wrong'

function main() {
  const mode = process.argv[2]
  if (!mode || (mode !== 'check' && mode !== 'add' && mode !== 'fix')) {
    console.error('Usage: tsx hack/license-header.ts <check|add|fix>')
    console.error('')
    console.error('  check  — report files with missing/wrong headers (exit 1 on failure)')
    console.error('  add    — insert headers where missing; leave existing ones untouched')
    console.error('  fix    — insert or replace headers to match canonical form')
    process.exit(1)
  }

  const scanDirs = [
    join(ROOT, 'apps'),
    join(ROOT, 'packages'),
    join(ROOT, 'hack'),
    join(ROOT, 'makefiles'),
    ROOT,
  ]

  const targets = scanDirs.flatMap((d) => walkDir(d, ROOT))
  const results: { rel: string; action: FileAction }[] = []

  for (const filePath of targets) {
    const content = readFileSync(filePath, 'utf-8')
    const rel = relative(ROOT, filePath)
    const fileName = filePath.split('/').pop()!
    const style = styleForFile(fileName)!
    const existing = extractHeader(content, style)

    if (existing !== null && headersMatch(existing, style)) {
      results.push({ rel, action: 'ok' })
      continue
    }

    if (mode === 'check') {
      results.push({ rel, action: existing === null ? 'missing' : 'wrong' })
    } else if (mode === 'add') {
      if (existing === null) {
        const header = buildHeader(style)
        writeFileSync(filePath, header + '\n\n' + content)
        results.push({ rel, action: 'added' })
      } else {
        results.push({ rel, action: 'wrong' })
      }
    } else {
      const body = existing !== null ? stripHeader(content, style) : content
      const header = buildHeader(style)
      writeFileSync(filePath, header + '\n\n' + body)
      results.push({ rel, action: existing !== null ? 'fixed' : 'added' })
    }
  }

  // ── Report ──────────────────────────────────────────────────────────────

  const counts: Record<FileAction, number> = {
    ok: 0, added: 0, fixed: 0, missing: 0, wrong: 0,
  }

  for (const r of results) {
    counts[r.action]++
    switch (r.action) {
      case 'ok':
        break
      case 'added':
        console.log(`  \x1b[1;32m+\x1b[0m ${r.rel}`)
        break
      case 'fixed':
        console.log(`  \x1b[1;33m~\x1b[0m ${r.rel}`)
        break
      case 'missing':
        console.error(`  \x1b[1;31m✗\x1b[0m ${r.rel} — no header`)
        break
      case 'wrong':
        console.error(`  \x1b[1;33m~\x1b[0m ${r.rel} — header mismatch`)
        break
    }
  }

  console.log('')

  const total = results.length
  const problems = counts.missing + counts.wrong

  if (mode === 'check') {
    if (problems > 0) {
      console.error(`\x1b[1;31m✗\x1b[0m ${problems}/${total} files need attention (${counts.missing} missing, ${counts.wrong} wrong)`)
      console.error('  Run: \x1b[36mmake license-fix\x1b[0m to insert/replace headers')
      process.exit(1)
    }
    console.log(`\x1b[1;32m✓\x1b[0m All ${total} source files have correct license headers`)
  } else {
    const changed = counts.added + counts.fixed
    const unresolved = counts.wrong
    if (changed > 0) {
      console.log(`\x1b[1;32m✓\x1b[0m ${changed} file(s) updated`)
    }
    if (unresolved > 0) {
      console.error(`\x1b[1;33m⚠\x1b[0m ${unresolved} file(s) had wrong headers — use \x1b[36mmake license-fix\x1b[0m to replace`)
    }
    if (changed === 0 && unresolved === 0) {
      console.log(`\x1b[1;32m✓\x1b[0m All ${total} files already correct — nothing to do`)
    }
  }
}

main()
