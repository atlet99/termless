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

const logger = createLogger('worker:ttyd')

const TOKYO_NIGHT_THEME = {
  foreground: '#a9b1d6',
  background: '#1a1b26',
  cursor: '#c0caf5',
  cursorAccent: '#1a1b26',
  selectionBackground: '#33467c',
  black: '#15161e',
  red: '#f7768e',
  green: '#9ece6a',
  yellow: '#e0af68',
  blue: '#7aa2f7',
  magenta: '#bb9af7',
  cyan: '#7dcfff',
  white: '#a9b1d6',
}

export interface TtydOptions {
  port: number
  userId: number
  tmuxSession: string
  workspacePath: string
}

const activeProcesses = new Map<number, ChildProcess>()

export function startTtyd(options: TtydOptions): ChildProcess {
  const { port, userId, tmuxSession, workspacePath } = options

  logger.info({ port, userId, tmuxSession }, 'Starting ttyd')

  const args = [
    '--port',
    String(port),
    '--interface',
    '127.0.0.1',
    '--writable',
    '--max-clients',
    '5',
    '--title-format',
    `Termless: ${tmuxSession}`,
    '--client-option',
    'fontSize=15',
    '--client-option',
    'fontFamily=JetBrains Mono, Cascadia Code, monospace',
    '--client-option',
    `theme=${JSON.stringify(TOKYO_NIGHT_THEME)}`,
    'bash',
    '-c',
    `sudo -u termless-user-${userId} tmux new-session -A -s ${tmuxSession} -c ${workspacePath}`,
  ]

  const child = spawn('ttyd', args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  })

  child.on('error', (err) => {
    logger.error({ err, port }, 'ttyd failed to start')
  })

  child.on('exit', (code) => {
    logger.info({ port, code }, 'ttyd exited')
    activeProcesses.delete(port)
  })

  activeProcesses.set(port, child)
  return child
}

export function stopTtyd(port: number): void {
  const child = activeProcesses.get(port)
  if (child) {
    logger.info({ port }, 'Stopping ttyd')
    child.kill('SIGTERM')
    activeProcesses.delete(port)
  }
}

export function stopAllTtyd(): void {
  for (const [port, child] of activeProcesses) {
    logger.info({ port }, 'Stopping ttyd')
    child.kill('SIGTERM')
  }
  activeProcesses.clear()
}

export function getActivePorts(): number[] {
  return [...activeProcesses.keys()]
}
