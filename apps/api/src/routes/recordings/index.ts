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

import { createReadStream, existsSync } from 'node:fs'
import type { FastifyInstance } from 'fastify'

export async function registerRecordingRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/recordings',
    {
      schema: { tags: ['recordings'], description: 'List user recordings' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      return fastify.prisma.recording.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    },
  )

  fastify.get(
    '/api/v1/recordings/:id/stream',
    {
      schema: { tags: ['recordings'], description: 'Stream recording file' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }

      const recording = await fastify.prisma.recording.findUnique({ where: { id } })
      if (!recording || recording.userId !== user.id) {
        return reply.code(404).send({ error: 'Recording not found' })
      }

      if (!existsSync(recording.filePath)) {
        return reply.code(404).send({ error: 'Recording file not found' })
      }

      reply.header('Content-Type', 'application/x-asciicast')
      reply.header('Content-Disposition', `attachment; filename="${recording.id}.cast"`)

      return reply.send(createReadStream(recording.filePath))
    },
  )

  fastify.delete(
    '/api/v1/recordings/:id',
    {
      schema: { tags: ['recordings'], description: 'Delete recording' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }

      const recording = await fastify.prisma.recording.findUnique({ where: { id } })
      if (!recording || recording.userId !== user.id) {
        return reply.code(404).send({ error: 'Recording not found' })
      }

      await fastify.prisma.recording.delete({ where: { id } })
      void fastify.audit(user.id, 'recording.delete', { recordingId: id }, request.ip)

      return { ok: true }
    },
  )
}
