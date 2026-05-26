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

import { z } from 'zod'
import type { FastifyInstance } from 'fastify'

const createSnippetSchema = z.object({
  name: z.string().max(100),
  command: z.string().max(1000),
  tags: z.array(z.string().max(50)).max(10).optional(),
  scope: z.enum(['personal', 'workspace']).optional(),
})

const updateSnippetSchema = z.object({
  name: z.string().max(100).optional(),
  command: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
})

export async function registerSnippetRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/snippets',
    {
      schema: { tags: ['snippets'], description: 'List user snippets' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      return fastify.prisma.snippet.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
      })
    },
  )

  fastify.post(
    '/api/v1/snippets',
    {
      schema: { tags: ['snippets'], description: 'Create snippet' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const body = createSnippetSchema.parse(request.body)

      const snippet = await fastify.prisma.snippet.create({
        data: {
          userId: user.id,
          name: body.name,
          command: body.command,
          tags: body.tags ?? [],
          scope: body.scope ?? 'personal',
        },
      })

      void fastify.audit(user.id, 'snippet.create', { snippetId: snippet.id }, request.ip)
      return reply.code(201).send(snippet)
    },
  )

  fastify.put(
    '/api/v1/snippets/:id',
    {
      schema: { tags: ['snippets'], description: 'Update snippet' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }
      const body = updateSnippetSchema.parse(request.body)

      const existing = await fastify.prisma.snippet.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return reply.code(404).send({ error: 'Snippet not found' })
      }

      const data: Record<string, unknown> = {}
      if (body.name !== undefined) data.name = body.name
      if (body.command !== undefined) data.command = body.command
      if (body.tags !== undefined) data.tags = body.tags

      const snippet = await fastify.prisma.snippet.update({
        where: { id },
        data,
      })

      return snippet
    },
  )

  fastify.delete(
    '/api/v1/snippets/:id',
    {
      schema: { tags: ['snippets'], description: 'Delete snippet' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }

      const existing = await fastify.prisma.snippet.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return reply.code(404).send({ error: 'Snippet not found' })
      }

      await fastify.prisma.snippet.delete({ where: { id } })
      void fastify.audit(user.id, 'snippet.delete', { snippetId: id }, request.ip)

      return { ok: true }
    },
  )
}
