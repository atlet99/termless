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

import { mkdir, unlink, writeFile } from 'node:fs/promises'

import { createLogger } from './logger.js'

const logger = createLogger('worker:sudoers')

const SUDOERS_DIR = '/etc/sudoers.d'
const OPERATOR_COMMANDS = [
  '/usr/bin/apt-get install *',
  '/usr/bin/apt-get update',
  '/usr/bin/npm install -g *',
  '/usr/bin/pip3 install *',
]

export async function createSudoersFile(systemUid: number, role: string): Promise<void> {
  if (role !== 'OPERATOR' && role !== 'ADMIN') return

  const username = `termless-user-${String(systemUid)}`
  const path = `${SUDOERS_DIR}/${username}`
  const lines = OPERATOR_COMMANDS.map((cmd) => `${username} ALL=(root) NOPASSWD: ${cmd}`)

  await mkdir(SUDOERS_DIR, { recursive: true })
  await writeFile(path, `${lines.join('\n')}\n`, { mode: 0o440 })

  logger.info({ username, role }, 'Created sudoers file')
}

export async function removeSudoersFile(systemUid: number): Promise<void> {
  const username = `termless-user-${String(systemUid)}`
  const path = `${SUDOERS_DIR}/${username}`

  try {
    await unlink(path)
    logger.info({ username }, 'Removed sudoers file')
  } catch {
    // file may not exist
  }
}
