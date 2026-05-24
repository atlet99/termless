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

import type { FastifyInstance } from 'fastify'

const startTime = Date.now()

export async function registerSystemRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      schema: { tags: ['system'], description: 'Liveness probe' },
    },
    async () => {
      return {
        status: 'ok',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        version: process.env.npm_package_version ?? '0.1.0',
        timestamp: new Date().toISOString(),
      }
    },
  )

  fastify.get(
    '/ready',
    {
      schema: { tags: ['system'], description: 'Readiness probe' },
    },
    async (_request, reply) => {
      const checks: Record<string, { status: string; latencyMs?: number }> = {}
      let overallStatus: 'ok' | 'degraded' | 'down' = 'ok'

      const dbStart = Date.now()
      try {
        await fastify.prisma.$queryRaw`SELECT 1`
        checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
      } catch {
        checks.database = { status: 'down', latencyMs: Date.now() - dbStart }
        overallStatus = 'down'
      }

      const redisUrl = process.env.REDIS_URL
      if (redisUrl) {
        const redisStart = Date.now()
        try {
          const { getRedisClient } = await import('@termless/auth')
          const client = await getRedisClient(redisUrl)
          await client.ping()
          checks.redis = { status: 'ok', latencyMs: Date.now() - redisStart }
        } catch {
          checks.redis = { status: 'down', latencyMs: Date.now() - redisStart }
          overallStatus = overallStatus === 'down' ? 'down' : 'degraded'
        }
      }

      const statusCode = overallStatus === 'down' ? 503 : 200
      return reply.code(statusCode).send({
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString(),
      })
    },
  )

  fastify.get(
    '/openapi.json',
    {
      schema: { hide: true },
    },
    async (request, reply) => {
      const spec = fastify.swagger()

      const ROLE_VISIBLE_TAGS: Record<string, string[]> = {
        VIEWER: ['auth', 'system'],
        DEVELOPER: ['auth', 'sessions', 'workspaces', 'system'],
        OPERATOR: ['auth', 'sessions', 'workspaces', 'system'],
        ADMIN: ['auth', 'sessions', 'workspaces', 'admin', 'system'],
      }

      const role = request.user?.role ?? 'VIEWER'
      const allowedTags = ROLE_VISIBLE_TAGS[role] ?? []

      const filteredPaths: Record<string, unknown> = {}
      for (const [path, methods] of Object.entries(spec.paths ?? {})) {
        const filteredMethods: Record<string, unknown> = {}
        for (const [method, operation] of Object.entries(
          methods as Record<string, { tags?: string[] }>,
        )) {
          const opTags: string[] = operation.tags ?? []
          if (opTags.length === 0 || opTags.some((t) => allowedTags.includes(t))) {
            filteredMethods[method] = operation
          }
        }
        if (Object.keys(filteredMethods).length > 0) {
          filteredPaths[path] = filteredMethods
        }
      }

      return reply.send({ ...spec, paths: filteredPaths })
    },
  )
}
