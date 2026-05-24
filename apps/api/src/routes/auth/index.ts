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

import { createSession, destroySession, verifyPassword, verifyTotpCode } from '@termless/auth'
import { loginSchema } from '@termless/shared'
import { authAttemptsTotal } from '@termless/shared'
import type { FastifyInstance } from 'fastify'

export async function registerAuthRoutes(fastify: FastifyInstance) {
  const redisUrl = process.env.REDIS_URL

  fastify.post(
    '/auth/login',
    {
      schema: {
        tags: ['auth'],
        description: 'Local authentication',
      },
      config: {
        rateLimit: { max: 5, timeWindow: '15 minutes' },
      },
    },
    async (request, reply) => {
      const body = loginSchema.parse(request.body)
      const prisma = fastify.prisma

      const user = await prisma.user.findUnique({ where: { email: body.email } })
      if (!user?.passwordHash) {
        authAttemptsTotal.inc({ mode: 'local', result: 'failure' })
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      const valid = await verifyPassword(body.password, user.passwordHash)
      if (!valid) {
        authAttemptsTotal.inc({ mode: 'local', result: 'failure' })
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      if (user.totpSecret) {
        if (!body.totpCode || !verifyTotpCode(user.totpSecret, body.totpCode)) {
          authAttemptsTotal.inc({ mode: 'local', result: 'failure' })
          return reply.code(401).send({ error: 'Invalid TOTP code' })
        }
      } else if (user.role === 'ADMIN' || user.role === 'OPERATOR') {
        authAttemptsTotal.inc({ mode: 'local', result: 'failure' })
        return reply.code(403).send({
          error: 'TOTP setup required',
          message: 'ADMIN and OPERATOR roles require 2FA. Please set up TOTP first.',
        })
      }

      if (!redisUrl) {
        return reply.code(500).send({ error: 'Redis not configured' })
      }
      const ttlSeconds = 8 * 60 * 60
      const token = await createSession(
        redisUrl,
        {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
        ttlSeconds,
      )

      authAttemptsTotal.inc({ mode: 'local', result: 'success' })
      void fastify.audit(user.id, 'auth.login', undefined, request.ip)

      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
        },
      }
    },
  )

  fastify.post(
    '/auth/logout',
    {
      schema: { tags: ['auth'], description: 'Destroy session' },
    },
    async (request, _reply) => {
      const authHeader = request.headers.authorization
      if (authHeader?.startsWith('Bearer ') && redisUrl) {
        await destroySession(redisUrl, authHeader.slice(7))
      }
      return { ok: true }
    },
  )

  fastify.get(
    '/auth/me',
    {
      schema: { tags: ['auth'], description: 'Get current user from session' },
    },
    async (request, reply) => {
      if (!request.user) {
        return reply.code(401).send({ error: 'Not authenticated' })
      }
      return { user: request.user }
    },
  )

  fastify.get(
    '/auth/oidc/start',
    {
      schema: { tags: ['auth'], description: 'Start OIDC flow' },
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (_request, reply) => {
      return reply.code(501).send({ error: 'OIDC not yet configured' })
    },
  )

  fastify.get(
    '/auth/oidc/callback',
    {
      schema: { tags: ['auth'], hide: true, description: 'OIDC callback' },
    },
    async (_request, reply) => {
      return reply.code(501).send({ error: 'OIDC not yet configured' })
    },
  )
}
