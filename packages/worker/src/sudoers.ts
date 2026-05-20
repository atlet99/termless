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

  const username = `termless-user-${systemUid}`
  const path = `${SUDOERS_DIR}/${username}`
  const lines = OPERATOR_COMMANDS.map((cmd) => `${username} ALL=(root) NOPASSWD: ${cmd}`)

  await mkdir(SUDOERS_DIR, { recursive: true })
  await writeFile(path, `${lines.join('\n')}\n`, { mode: 0o440 })

  logger.info({ username, role }, 'Created sudoers file')
}

export async function removeSudoersFile(systemUid: number): Promise<void> {
  const username = `termless-user-${systemUid}`
  const path = `${SUDOERS_DIR}/${username}`

  try {
    await unlink(path)
    logger.info({ username }, 'Removed sudoers file')
  } catch {
    // file may not exist
  }
}
