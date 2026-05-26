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

import { getRedisClient } from '@termless/auth'
import type { FastifyInstance } from 'fastify'
import WebSocket from 'ws'

export async function registerShareWs(fastify: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) return

  fastify.get(
    '/ws/view/:shareToken',
    { websocket: true } as never,
    async (socket: WebSocket, request: any) => {
      const { shareToken } = request.params
      const client = await getRedisClient(redisUrl)

      const key = `termless:share:${shareToken}`
      const data = await client.get(key)
      if (!data) {
        socket.close(4004, 'Share link not found or expired')
        return
      }

      const shareData = JSON.parse(data) as { sessionId: string }
      const prisma = fastify.prisma

      const session = await prisma.session.findUnique({
        where: { id: shareData.sessionId },
      })
      if (!session?.ttydPort) {
        socket.close(4004, 'Session not found or not ready')
        return
      }

      const ttydUrl = `ws://127.0.0.1:${session.ttydPort}/ws`
      const ttydSocket = new WebSocket(ttydUrl, 'tty')

      socket.send(JSON.stringify({ type: 'connected', sessionId: session.id, readonly: true }))

      ttydSocket.on('message', (message: WebSocket.Data) => {
        const payload =
          typeof message === 'string' ? message : Buffer.from(message as Buffer).toString()
        socket.send(payload)
      })

      socket.on('message', (message: unknown) => {
        if (typeof message !== 'string') return
        try {
          const parsed = JSON.parse(message) as { type?: string }
          if (parsed.type === 'resize') {
            ttydSocket.send(message)
          }
        } catch {
          // ignore non-JSON messages — readonly mode drops input
        }
      })

      ttydSocket.on('close', () => {
        socket.close()
      })

      socket.on('close', () => {
        ttydSocket.close()
      })

      ttydSocket.on('error', () => {
        socket.close(5000, 'ttyd connection error')
      })
    },
  )
}
