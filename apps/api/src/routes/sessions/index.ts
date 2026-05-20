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
import { createSessionSchema } from '@termless/shared'
import { activeSessionsTotal } from '@termless/shared'
import { startTtyd } from '@termless/worker'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'

export async function registerSessionRoutes(fastify: FastifyInstance) {
  const workspaceRoot = process.env.WORKSPACE_ROOT

  fastify.get(
    '/api/v1/sessions',
    {
      schema: { tags: ['sessions'], description: 'List user sessions' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request) => {
      const prisma = (fastify as any).prisma as PrismaClient
      const userId = (request as any).user.id
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      return sessions
    },
  )

  fastify.post(
    '/api/v1/sessions',
    {
      schema: { tags: ['sessions'], description: 'Create terminal session' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const body = createSessionSchema.parse(request.body)
      const user = (request as any).user
      const prisma = (fastify as any).prisma as PrismaClient

      const maxSessions = Number(process.env.MAX_SESSIONS_PER_USER) || 5
      const currentCount = await prisma.session.count({ where: { userId: user.id } })
      if (currentCount >= maxSessions) {
        return reply.code(429).send({ error: 'Session limit reached' })
      }

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          tool: body.tool,
          tmuxSession: `termless-${user.id}-${body.tool}-${Date.now()}`,
        },
      })

      const workspacePath = `${workspaceRoot}/termless-user-${user.id}`

      if (user.systemUid) {
        const port = 10000 + Math.floor(Math.random() * 50000)
        startTtyd({
          port,
          userId: user.systemUid,
          tmuxSession: session.tmuxSession,
          workspacePath,
        })
        await prisma.session.update({
          where: { id: session.id },
          data: { ttydPort: port },
        })
      }

      activeSessionsTotal.inc({ tool: body.tool, role: user.role })
      ;(fastify as any).audit?.(user.id, 'session.create', { tool: body.tool }, request.ip)

      return {
        id: session.id,
        tool: session.tool,
        tmuxSession: session.tmuxSession,
        wsUrl: `/ws/terminal/${session.id}`,
      }
    },
  )

  fastify.delete(
    '/api/v1/sessions/:id',
    {
      schema: { tags: ['sessions'], description: 'Delete session' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = (request as any).user
      const prisma = (fastify as any).prisma as PrismaClient

      const session = await prisma.session.findUnique({ where: { id } })
      if (!session) {
        return reply.code(404).send({ error: 'Session not found' })
      }
      if (session.userId !== user.id && user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      if (session.ttydPort) {
        const { stopTtyd } = await import('@termless/worker')
        stopTtyd(session.ttydPort)
      }

      await prisma.session.delete({ where: { id } })
      activeSessionsTotal.dec({ tool: session.tool, role: user.role })
      ;(fastify as any).audit?.(user.id, 'session.delete', { sessionId: id }, request.ip)

      return { ok: true }
    },
  )
}
