import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { createLogger } from './logger.js'

const logger = createLogger('worker:tmux')
const execAsync = promisify(exec)

export async function listSessions(userId: number): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      `sudo -u termless-user-${userId} tmux list-sessions -F '#{session_name}'`,
    )
    return stdout.trim().split('\n').filter(Boolean)
  } catch {
    return []
  }
}

export async function sessionExists(sessionName: string, userId: number): Promise<boolean> {
  const sessions = await listSessions(userId)
  return sessions.includes(sessionName)
}

export async function killSession(sessionName: string, userId: number): Promise<void> {
  logger.info({ sessionName, userId }, 'Killing tmux session')
  await execAsync(`sudo -u termless-user-${userId} tmux kill-session -t ${sessionName}`)
}

export async function hasActiveClients(sessionName: string, userId: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `sudo -u termless-user-${userId} tmux list-commands -t ${sessionName} 2>&1`,
    )
    return !stdout.includes('no server running')
  } catch {
    return false
  }
}
