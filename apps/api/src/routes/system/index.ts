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

import { execFileSync } from 'node:child_process'
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
      const checks: Record<string, { status: string; latencyMs?: number; freeGb?: number }> = {}
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

      try {
        const workspaceRoot = process.env.WORKSPACE_ROOT ?? '/workspace'
        // eslint-disable-next-line sonarjs/no-os-command-from-path -- df is a standard system utility
        const df = execFileSync('df', ['-BG', workspaceRoot], { encoding: 'utf8' })
        const parts = df.trim().split(/\s+/)
        const freeGb = Number.parseFloat(parts[3]?.replace('G', '') ?? '0')
        checks.disk = { status: freeGb > 1 ? 'ok' : 'degraded', freeGb }
        if (freeGb <= 1) overallStatus = overallStatus === 'down' ? 'down' : 'degraded'
      } catch {
        checks.disk = { status: 'unknown' }
      }

      const statusCode = overallStatus === 'down' ? 503 : 200
      return reply.code(statusCode).send({
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString(),
      })
    },
  )
}
