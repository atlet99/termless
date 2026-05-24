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

import { createWorkspaceSchema } from '@termless/shared'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'

export async function registerWorkspaceRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/workspaces',
    {
      schema: { tags: ['workspaces'], description: 'List workspaces' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request) => {
      const prisma = fastify.prisma
      const userId = request.user!.id
      return prisma.workspace.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
    },
  )

  fastify.post(
    '/api/v1/workspaces',
    {
      schema: { tags: ['workspaces'], description: 'Create workspace' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const body = createWorkspaceSchema.parse(request.body)
      const user = request.user!
      const prisma = fastify.prisma

      const workspace = await prisma.workspace.create({
        data: {
          userId: user.id,
          name: body.name,
          path: body.path,
        },
      })
      void fastify.audit(user.id, 'workspace.create', { name: body.name }, request.ip)
      return reply.code(201).send(workspace)
    },
  )
}
