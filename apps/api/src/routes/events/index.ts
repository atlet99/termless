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

import { eventBus, type NotificationEvent } from '../../lib/event-bus.js'
import type { FastifyInstance } from 'fastify'

export async function registerNotificationRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/events',
    {
      schema: { tags: ['notifications'], description: 'SSE event stream' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      reply.raw.setHeader('Content-Type', 'text/event-stream')
      reply.raw.setHeader('Cache-Control', 'no-cache')
      reply.raw.setHeader('Connection', 'keep-alive')
      reply.raw.setHeader('X-Accel-Buffering', 'no')

      const unsubscribe = eventBus.subscribe(user.id, (event: NotificationEvent) => {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`)
      })

      reply.raw.write(
        `data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString(), data: {} })}\n\n`,
      )

      const heartbeat = setInterval(() => {
        reply.raw.write(': heartbeat\n\n')
      }, 30_000)

      request.raw.on('close', () => {
        clearInterval(heartbeat)
        unsubscribe()
      })

      return reply
    },
  )
}
