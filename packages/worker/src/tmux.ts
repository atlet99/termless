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

import { exec } from 'node:child_process'
import { promisify } from 'node:util'

import { createLogger } from './logger.js'

const logger = createLogger('worker:tmux')
const execAsync = promisify(exec)

export async function listSessions(userId: number): Promise<string[]> {
  try {
    const { stdout } = await execAsync(
      `sudo -u termless-user-${String(userId)} tmux list-sessions -F '#{session_name}'`,
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
  await execAsync(`sudo -u termless-user-${String(userId)} tmux kill-session -t ${sessionName}`)
}

export async function hasActiveClients(sessionName: string, userId: number): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `sudo -u termless-user-${String(userId)} tmux list-commands -t ${sessionName} 2>&1`,
    )
    return !stdout.includes('no server running')
  } catch {
    return false
  }
}
