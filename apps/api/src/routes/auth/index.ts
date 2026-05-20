import type { PrismaClient } from '@prisma/client'
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
      const prisma = (fastify as any).prisma as PrismaClient

      const user = await prisma.user.findUnique({ where: { email: body.email } })
      if (!user || !user.passwordHash) {
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
      }

      const redisUrl = process.env.REDIS_URL
      const ttlSeconds = 8 * 60 * 60
      const token = await createSession(
        redisUrl,
        {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          role: user.role as any,
        },
        ttlSeconds,
      )

      authAttemptsTotal.inc({ mode: 'local', result: 'success' })
      ;(fastify as any).audit?.(user.id, 'auth.login', undefined, request.ip)

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
    '/auth/oidc/start',
    {
      schema: { tags: ['auth'], description: 'Start OIDC flow' },
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
