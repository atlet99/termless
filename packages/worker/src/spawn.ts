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

import { type ChildProcess, spawn } from 'node:child_process'
import { createLogger } from './logger.js'

const logger = createLogger('worker:spawn')

const TOOL_BINARIES: Record<string, string> = {
  OPENCODE: 'opencode',
  CLAUDE: 'claude',
  BASH: 'bash',
}

export interface SpawnOptions {
  userId: string
  systemUid: number
  tool: string
  sessionId: string
  workspacePath: string
  env?: Record<string, string>
}

export function spawnIsolatedProcess(options: SpawnOptions): ChildProcess {
  const { userId, systemUid, tool, sessionId, workspacePath, env } = options
  const toolBinary = TOOL_BINARIES[tool]
  if (!toolBinary) {
    throw new Error(`Unknown tool: ${tool}`)
  }

  const tmuxSession = `termless-${userId}-${tool}-${sessionId}`

  logger.info({ userId, tool, sessionId, tmuxSession }, 'Spawning isolated process')

  const args: string[] = [
    '-u',
    `termless-user-${systemUid}`,
    'unshare',
    '--pid',
    '--mount',
    '--fork',
    '--',
    'tmux',
    'new-session',
    '-A',
    '-s',
    tmuxSession,
    '-c',
    workspacePath,
  ]

  if (tool !== 'BASH') {
    args.push(toolBinary)
  }

  const child = spawn('sudo', args, {
    cwd: workspacePath,
    env: {
      HOME: workspacePath,
      PATH: process.env.PATH,
      TERM: 'xterm-256color',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  child.on('error', (err) => {
    logger.error({ err, userId, tool }, 'Failed to spawn process')
  })

  child.on('exit', (code) => {
    logger.info({ userId, tool, code }, 'Process exited')
  })

  return child
}

export function killProcess(tmuxSession: string, systemUid: number): void {
  logger.info({ tmuxSession }, 'Killing tmux session')
  spawn('sudo', ['-u', `termless-user-${systemUid}`, 'tmux', 'kill-session', '-t', tmuxSession])
}
