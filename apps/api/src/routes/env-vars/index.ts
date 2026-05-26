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

import { envVariableSchema } from '@termless/shared'
import { decryptEnvVariable, encryptEnvVariable, maskValue } from '@termless/shared'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'

export async function registerEnvVariableRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/env-vars',
    {
      schema: { tags: ['env-vars'], description: 'List environment variables' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request) => {
      const user = request.user
      if (!user) return { data: [] }
      const variables = await fastify.prisma.userEnvVar.findMany({
        where: { userId: user.id },
        select: { id: true, name: true, encryptedVal: true, createdAt: true, updatedAt: true },
        orderBy: { name: 'asc' },
      })

      const decrypted = variables.map((v) => {
        const value = decryptEnvVariable(v.encryptedVal)
        return {
          ...v,
          maskedValue: maskValue(value),
        }
      })

      return { data: decrypted }
    },
  )

  fastify.post(
    '/api/v1/env-vars',
    {
      schema: { tags: ['env-vars'], description: 'Create/update environment variable' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      const { name, value } = envVariableSchema.parse(request.body)

      const encrypted = encryptEnvVariable(value)
      const existing = await fastify.prisma.userEnvVar.findUnique({
        // eslint-disable-next-line @typescript-eslint/naming-convention -- Prisma composite key
        where: { userId_name: { userId: user.id, name } },
      })

      const envVariable = existing
        ? await fastify.prisma.userEnvVar.update({
            where: { id: existing.id },
            data: { encryptedVal: encrypted },
          })
        : await fastify.prisma.userEnvVar.create({
            data: { userId: user.id, name, encryptedVal: encrypted },
          })

      void fastify.audit(user.id, 'env_var.upsert', { name }, request.ip)

      const decryptedValue = decryptEnvVariable(envVariable.encryptedVal)
      return reply.code(201).send({
        ...envVariable,
        maskedValue: maskValue(decryptedValue),
      })
    },
  )

  fastify.delete(
    '/api/v1/env-vars/:name',
    {
      schema: { tags: ['env-vars'], description: 'Delete environment variable' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      const { name } = request.params as { name: string }

      await fastify.prisma.userEnvVar.deleteMany({
        where: { userId: user.id, name },
      })

      void fastify.audit(user.id, 'env_var.delete', { name }, request.ip)
      return { ok: true }
    },
  )
}
