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

import { createSessionTemplateSchema, updateSessionTemplateSchema } from '@termless/shared'
import type { FastifyInstance } from 'fastify'

export async function registerTemplateRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/templates',
    {
      schema: { tags: ['templates'], description: 'List user session templates' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      return fastify.prisma.sessionTemplate.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      })
    },
  )

  fastify.post(
    '/api/v1/templates',
    {
      schema: { tags: ['templates'], description: 'Create session template' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const body = createSessionTemplateSchema.parse(request.body)

      const template = await fastify.prisma.sessionTemplate.create({
        data: {
          userId: user.id,
          name: body.name,
          tool: body.tool,
          workingDir: body.workingDir,
          envVars: body.envVars ?? null,
          snippetIds: body.snippetIds ?? [],
        },
      })

      void fastify.audit(user.id, 'template.create', { templateId: template.id }, request.ip)
      return reply.code(201).send(template)
    },
  )

  fastify.put(
    '/api/v1/templates/:id',
    {
      schema: { tags: ['templates'], description: 'Update session template' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }
      const body = updateSessionTemplateSchema.parse(request.body)

      const existing = await fastify.prisma.sessionTemplate.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return reply.code(404).send({ error: 'Template not found' })
      }

      const data: Record<string, unknown> = {}
      if (body.name !== undefined) data.name = body.name
      if (body.tool !== undefined) data.tool = body.tool
      if (body.workingDir !== undefined) data.workingDir = body.workingDir
      if (body.envVars !== undefined) data.envVars = body.envVars ?? null
      if (body.snippetIds !== undefined) data.snippetIds = body.snippetIds

      const template = await fastify.prisma.sessionTemplate.update({
        where: { id },
        data,
      })

      return template
    },
  )

  fastify.delete(
    '/api/v1/templates/:id',
    {
      schema: { tags: ['templates'], description: 'Delete session template' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }

      const existing = await fastify.prisma.sessionTemplate.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return reply.code(404).send({ error: 'Template not found' })
      }

      await fastify.prisma.sessionTemplate.delete({ where: { id } })
      void fastify.audit(user.id, 'template.delete', { templateId: id }, request.ip)

      return { ok: true }
    },
  )
}
