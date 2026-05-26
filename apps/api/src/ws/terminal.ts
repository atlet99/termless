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

import { getRedisClient, getSession } from '@termless/auth'
import { terminalConnectionsTotal, terminalDuration } from '@termless/shared'
import { startRecording } from '@termless/worker'
import { eventBus } from '../lib/event-bus.js'
import { triggerWebhook } from '../routes/webhooks/index.js'
import type { FastifyInstance } from 'fastify'
import WebSocket from 'ws'

const SESSION_IDLE_TIMEOUT_MS = Number(process.env.SESSION_IDLE_TIMEOUT_MS ?? 30 * 60 * 1000) // 30 mins default
const SESSION_AUTO_PAUSE_MS = Number(process.env.SESSION_AUTO_PAUSE_MS ?? 60 * 60 * 1000) // 60 mins default

/**
 * Checks for idle sessions and logs auto-pause events
 */
async function checkAndPauseIdleSessions(fastify: FastifyInstance): Promise<void> {
  if (SESSION_AUTO_PAUSE_MS <= 0) return

  const idleThreshold = new Date(Date.now() - SESSION_AUTO_PAUSE_MS)
  const idleSessions = await fastify.prisma.session.findMany({
    where: {
      lastSeenAt: { lt: idleThreshold },
      ttydPort: { not: null },
    },
    select: { id: true, userId: true },
  })

  for (const session of idleSessions) {
    void fastify.audit(session.userId, 'session.auto_pause', { sessionId: session.id }, 'system')
  }
}

async function authenticateUser(request: any, redisUrl: string | undefined) {
  const user = request.user
  if (user) return user
  if (!redisUrl) return null

  const subprotocol = request.headers['sec-websocket-protocol']
  if (!subprotocol?.startsWith('bearer.')) return null

  const token = subprotocol.slice(7)
  return token ? getSession(redisUrl, token) : null
}

async function hasSessionAccess(
  sessionId: string,
  _userId: string,
  role: string,
  inviteToken: string | undefined,
  redisUrl: string | undefined,
): Promise<boolean> {
  if (role === 'ADMIN') return true

  if (!inviteToken) return false
  if (!redisUrl) return false

  const client = await getRedisClient(redisUrl)
  const inviteData = await client.get(`termless:invite:${inviteToken}`)
  if (!inviteData) return false

  const invite = JSON.parse(inviteData) as { sessionId: string }
  return invite.sessionId === sessionId
}

export async function registerTerminalWs(fastify: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL

  // Schedule periodic auto-pause check for idle sessions
  if (SESSION_AUTO_PAUSE_MS > 0) {
    setInterval(() => {
      void checkAndPauseIdleSessions(fastify)
    }, 60 * 1000) // Check every minute
  }

  fastify.get(
    '/ws/terminal/:sessionId',
    { websocket: true } as never,
    async (socket: any, request: any) => {
      const user = await authenticateUser(request, redisUrl)
      if (!user) {
        socket.close(4001, 'Unauthorized')
        return
      }

      const { sessionId } = request.params
      const session = await fastify.prisma.session.findUnique({ where: { id: sessionId } })
      if (!session) {
        socket.close(4004, 'Session not found')
        return
      }

      const isOwner = session.userId === user.id
      if (!isOwner) {
        const inviteToken = request.query.inviteToken as string | undefined
        const hasAccess = await hasSessionAccess(
          sessionId,
          user.id,
          user.role,
          inviteToken,
          redisUrl,
        )
        if (!hasAccess) {
          socket.close(4003, 'Forbidden')
          return
        }
      }

      if (!session.ttydPort) {
        socket.close(4005, 'Session not ready')
        return
      }

      // Check idle timeout
      if (SESSION_IDLE_TIMEOUT_MS > 0 && session.lastSeenAt) {
        const idleMs = Date.now() - session.lastSeenAt.getTime()
        if (idleMs > SESSION_IDLE_TIMEOUT_MS) {
          socket.close(4006, 'Session idle timeout')
          return
        }
      }

      const shouldRecord = request.query.record === 'true' && isOwner
      let recording: ReturnType<typeof startRecording> | null = null

      if (shouldRecord) {
        recording = startRecording(user.id, sessionId, 80, 24)
        void fastify.audit(user.id, 'recording.start', { sessionId }, request.ip)
      }

      const ttydUrl = `ws://127.0.0.1:${session.ttydPort}/ws`
      const ttydSocket = new WebSocket(ttydUrl, 'tty')

      terminalConnectionsTotal.inc({ tool: session.tool })
      const connectionStart = Date.now()

      socket.send(JSON.stringify({ type: 'connected', sessionId, recording: !!recording }))

      ttydSocket.on('message', (data: WebSocket.Data) => {
        const payload = typeof data === 'string' ? data : Buffer.from(data as Buffer).toString()
        socket.send(payload)
        if (recording) {
          recording.write(payload)
        }
      })

      socket.on('message', (data: unknown) => {
        if (typeof data === 'string') {
          ttydSocket.send(data)
        }
        // Update last seen timestamp for idle timeout
        if (session && SESSION_IDLE_TIMEOUT_MS > 0) {
          fastify.prisma.session.update({
            where: { id: session.id },
            data: { lastSeenAt: new Date() },
          })
        }
      })

      ttydSocket.on('close', () => {
        socket.close()
      })

      socket.on('close', async () => {
        const durationSeconds = (Date.now() - connectionStart) / 1000
        terminalDuration.observe({ tool: session.tool }, durationSeconds)
        ttydSocket.close()

        if (recording) {
          const { duration, sizeBytes } = recording.stop()
          await fastify.prisma.recording.create({
            data: {
              userId: user.id,
              sessionId,
              filePath: recording.filePath,
              duration,
              sizeBytes,
            },
          })
          void fastify.audit(user.id, 'recording.stop', { sessionId, duration }, request.ip)
          void triggerWebhook(
            fastify,
            'recording.completed',
            { sessionId, duration, sizeBytes },
            user.id,
          )
          eventBus.publish(user.id, {
            type: 'recording.completed',
            timestamp: new Date().toISOString(),
            data: { sessionId, duration, sizeBytes },
          })
        }
      })

      ttydSocket.on('error', () => {
        socket.close(5000, 'ttyd connection error')
      })
    },
  )
}
