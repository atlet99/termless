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
import { triggerWebhook } from '../webhooks/index.js'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const createShareSchema = z.object({
  expiresIn: z.enum(['1h', '24h', '7d']),
})

const createPlaybackShareSchema = z.object({
  expiresIn: z.enum(['1h', '24h', '7d']),
})

function getExpiryTtl(expiresIn: string): number {
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

export async function registerShareRoutes(fastify: FastifyInstance) {
  fastify.post(
    '/api/v1/sessions/:id/share',
    {
      schema: { tags: ['sharing'], description: 'Create read-only share link' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }
      const body = createShareSchema.parse(request.body)

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
      const key = `termless:share:${token}`
      const ttl = getExpiryTtl(body.expiresIn)

      await client.set(
        key,
        JSON.stringify({
          sessionId: id,
          userId: user.id,
          createdAt: Date.now(),
        }),
        { EX: ttl },
      )

      void fastify.audit(user.id, 'session.share_created', { sessionId: id }, request.ip)
      void triggerWebhook(fastify, 'session.shared', { sessionId: id }, user.id)

      return reply.code(201).send({
        shareToken: token,
        expiresIn: body.expiresIn,
        url: `/view/${token}`,
      })
    },
  )

  fastify.delete(
    '/api/v1/sessions/:id/share',
    {
      schema: { tags: ['sharing'], description: 'Revoke share link' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }
      const { token } = request.query as { token?: string }

      if (!token) return reply.code(400).send({ error: 'Token required' })

      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) return reply.code(500).send({ error: 'Redis not configured' })

      const { getRedisClient } = await import('@termless/auth')
      const client = await getRedisClient(redisUrl)

      const key = `termless:share:${token}`
      const data = await client.get(key)
      if (!data) return reply.code(404).send({ error: 'Share link not found or expired' })

      const shareData = JSON.parse(data) as { sessionId: string; userId: string }
      if (shareData.sessionId !== id) return reply.code(404).send({ error: 'Share link not found' })
      if (shareData.userId !== user.id && user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      await client.del(key)
      void fastify.audit(user.id, 'session.share_revoked', { sessionId: id }, request.ip)

      return { ok: true }
    },
  )

  // Multi-user session playback share
  fastify.post(
    '/api/v1/recordings/:id/playback-share',
    {
      schema: { tags: ['sharing'], description: 'Create playback share link for recording' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }
      const body = createPlaybackShareSchema.parse(request.body)

      const recording = await fastify.prisma.recording.findUnique({
        where: { id },
        include: { session: true },
      })
      if (!recording) return reply.code(404).send({ error: 'Recording not found' })
      if (recording.userId !== user.id && user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      const redisUrl = process.env.REDIS_URL
      if (!redisUrl) return reply.code(500).send({ error: 'Redis not configured' })

      const { getRedisClient } = await import('@termless/auth')
      const client = await getRedisClient(redisUrl)

      const token = crypto.randomBytes(32).toString('hex')
      const key = `termless:playback:${token}`
      const ttl = getExpiryTtl(body.expiresIn)

      await client.set(
        key,
        JSON.stringify({
          recordingId: id,
          sessionId: recording.sessionId,
          userId: user.id,
          createdAt: Date.now(),
        }),
        { EX: ttl },
      )

      void fastify.audit(
        user.id,
        'recording.playback_share_created',
        { recordingId: id },
        request.ip,
      )

      return reply.code(201).send({
        playbackToken: token,
        expiresIn: body.expiresIn,
        url: `/playback/${token}`,
      })
    },
  )
}
