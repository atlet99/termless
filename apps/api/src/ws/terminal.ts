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

import type { PrismaClient } from '@prisma/client'
import type { FastifyInstance } from 'fastify'
import WebSocket from 'ws'

export async function registerTerminalWs(fastify: FastifyInstance) {
  fastify.get(
    '/ws/terminal/:sessionId',
    { websocket: true } as never,
    async (socket: any, request: any) => {
      const user = request.user
      if (!user) {
        socket.close(4001, 'Unauthorized')
        return
      }

      const { sessionId } = request.params
      const prisma = (fastify as any).prisma as PrismaClient

      const session = await prisma.session.findUnique({ where: { id: sessionId } })
      if (!session) {
        socket.close(4004, 'Session not found')
        return
      }
      if (session.userId !== user.id && user.role !== 'ADMIN') {
        socket.close(4003, 'Forbidden')
        return
      }

      if (!session.ttydPort) {
        socket.close(4005, 'Session not ready')
        return
      }

      const ttydUrl = `ws://127.0.0.1:${session.ttydPort}/ws`
      const ttydSocket = new WebSocket(ttydUrl, 'tty')

      ttydSocket.on('message', (data: WebSocket.Data) => {
        if (typeof data === 'string') {
          socket.send(data)
        } else {
          socket.send(Buffer.from(data as Buffer).toString())
        }
      })

      socket.on('message', (data: unknown) => {
        if (typeof data === 'string') {
          ttydSocket.send(data)
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
