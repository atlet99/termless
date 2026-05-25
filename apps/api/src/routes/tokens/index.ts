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

import { createApiTokenSchema } from '@termless/shared'
import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'

function generateToken(): string {
  return `ttls_${crypto.randomBytes(32).toString('hex')}`
}

export async function registerTokenRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/tokens',
    {
      schema: { tags: ['tokens'], description: 'List API tokens' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request) => {
      const user = request.user
      if (!user) return { data: [] }
      const tokens = await fastify.prisma.apiToken.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, expiresAt: true, createdAt: true, lastUsed: true },
        orderBy: { createdAt: 'desc' },
      })
      return { data: tokens }
    },
  )

  fastify.post(
    '/api/v1/tokens',
    {
      schema: { tags: ['tokens'], description: 'Create API token' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { name, expiresInDays } = createApiTokenSchema.parse(request.body)
      const token = generateToken()
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null

      const apiToken = await fastify.prisma.apiToken.create({
        data: {
          userId: user.id,
          name,
          tokenHash,
          expiresAt,
        },
      })

      void fastify.audit(user.id, 'token.create', { tokenId: apiToken.id }, request.ip)

      return reply.code(201).send({
        id: apiToken.id,
        name: apiToken.name,
        token,
        expiresAt: apiToken.expiresAt,
        createdAt: apiToken.createdAt,
      })
    },
  )

  fastify.delete(
    '/api/v1/tokens/:id',
    {
      schema: { tags: ['tokens'], description: 'Revoke API token' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }

      const token = await fastify.prisma.apiToken.findUnique({
        where: { id },
      })

      if (!token || token.userId !== user.id) {
        return reply.code(404).send({ error: 'Token not found' })
      }

      await fastify.prisma.apiToken.delete({ where: { id } })
      void fastify.audit(user.id, 'token.revoke', { tokenId: id }, request.ip)

      return { ok: true }
    },
  )
}
