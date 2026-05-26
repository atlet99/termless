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

import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { eventBus } from '../../lib/event-bus.js'

function getInviteTtl(expiresIn: string): number {
  switch (expiresIn) {
    case '1h': {
      return 3600
    }
    case '24h': {
      return 86_400
    }
    case '7d': {
      return 604_800
    }
    default: {
      return 3600
    }
  }
}

const createInviteSchema = z.object({
  expiresIn: z.enum(['1h', '24h', '7d']),
})

export async function registerInviteRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/sessions/:id/invite',
    {
      schema: { tags: ['sharing'], description: 'Create invite for interactive session sharing' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }
      const body = createInviteSchema.parse(request.body)

      const session = await fastify.prisma.session.findUnique({ where: { id } })
      if (!session) return reply.code(404).send({ error: 'Session not found' })
      if (session.userId !== user.id && user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) return reply.code(500).send({ error: 'Redis not configured' })

      const { getRedisClient } = await import('@termless/auth')
      const client = await getRedisClient(redisUrl)

      const token = crypto.randomBytes(32).toString('hex')
      const key = `termless:invite:${token}`
      const ttl = getInviteTtl(body.expiresIn)

      await client.set(
        key,
        JSON.stringify({
          sessionId: id,
          inviterId: user.id,
          createdAt: Date.now(),
        }),
        { EX: ttl },
      )

      void fastify.audit(user.id, 'session.invite_sent', { sessionId: id }, request.ip)

      eventBus.publish(user.id, {
        type: 'session.invite_sent',
        timestamp: new Date().toISOString(),
        data: { sessionId: id, inviteToken: token },
      })

      return reply.code(201).send({
        inviteToken: token,
        expiresIn: body.expiresIn,
      })
    },
  )

  fastify.get(
    '/api/v1/invites/:token',
    {
      schema: { tags: ['sharing'], description: 'Get invite details' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { token } = request.params as { token: string }

      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) return reply.code(500).send({ error: 'Redis not configured' })

      const { getRedisClient } = await import('@termless/auth')
      const client = await getRedisClient(redisUrl)

      const key = `termless:invite:${token}`
      const data = await client.get(key)
      if (!data) return reply.code(404).send({ error: 'Invite not found or expired' })

      const inviteData = JSON.parse(data) as { sessionId: string; inviterId: string }

      const session = await fastify.prisma.session.findUnique({
        where: { id: inviteData.sessionId },
      })
      if (!session) return reply.code(404).send({ error: 'Session not found' })

      return {
        sessionId: session.id,
        tool: session.tool,
        inviterId: inviteData.inviterId,
      }
    },
  )
}
