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

import { createWriteStream, mkdirSync, statSync } from 'node:fs'
import path from 'node:path'

import { createLogger } from './logger.js'

import type { Writable } from 'node:stream'

const logger = createLogger('worker:recording')

// eslint-disable-next-line sonarjs/publicly-writable-directories -- recordings are per-user, not public
const RECORDINGS_DIR = process.env.RECORDINGS_DIR ?? '/tmp/termless-recordings'

export interface RecordingSession {
  stream: Writable
  filePath: string
  startTime: number
  write: (data: string) => void
  stop: () => { duration: number; sizeBytes: number }
}

export function startRecording(
  userId: string,
  sessionId: string,
  cols: number,
  rows: number,
): RecordingSession {
  const userDirectory = path.join(RECORDINGS_DIR, userId)
  mkdirSync(userDirectory, { recursive: true })

  const filename = `${sessionId}-${Date.now()}.cast`
  const filePath = path.join(userDirectory, filename)

  const stream = createWriteStream(filePath)
  const startTime = Date.now()

  const header = JSON.stringify({
    version: 2,
    width: cols,
    height: rows,
    timestamp: Math.floor(startTime / 1000),
    title: `Session ${sessionId}`,
  })
  stream.write(`${header}\n`)

  logger.info({ userId, sessionId, filePath }, 'Recording started')

  function write(data: string): void {
    const elapsed = (Date.now() - startTime) / 1000
    const event = JSON.stringify([elapsed, 'o', data])
    stream.write(`${event}\n`)
  }

  function stop(): { duration: number; sizeBytes: number } {
    const duration = Math.round((Date.now() - startTime) / 1000)
    stream.end()

    let sizeBytes = 0
    try {
      const stat = statSync(filePath)
      sizeBytes = stat.size
    } catch {
      // file may not exist yet
    }

    logger.info({ userId, sessionId, duration, sizeBytes }, 'Recording stopped')
    return { duration, sizeBytes }
  }

  return { stream, filePath, startTime, write, stop }
}
