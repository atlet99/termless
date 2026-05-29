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

import {
  createSession,
  destroySession,
  generateTotpSecret,
  verifyPassword,
  verifyTotpCode,
} from '@termless/auth'
import { loginSchema } from '@termless/shared'
import { authAttemptsTotal } from '@termless/shared'
import { totpSetupSchema } from '@termless/shared'
import { triggerWebhook } from '../webhooks/index.js'
import { eventBus } from '../../lib/event-bus.js'
import type { FastifyInstance } from 'fastify'

const AUTH_LOGIN_ACTION = 'auth.login'

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
      } else if (user.totpVerified || user.role === 'ADMIN' || user.role === 'OPERATOR') {
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
      void fastify.audit(user.id, AUTH_LOGIN_ACTION, undefined, request.ip)
      void triggerWebhook(fastify, AUTH_LOGIN_ACTION, { userId: user.id }, user.id)
      eventBus.publish(user.id, {
        type: AUTH_LOGIN_ACTION,
        timestamp: new Date().toISOString(),
        data: { userId: user.id },
      })

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
      const issuerUrl = process.env.OIDC_ISSUER_URL
      const clientId = process.env.OIDC_CLIENT_ID

      if (!issuerUrl || !clientId) {
        return reply
          .code(501)
          .send({ error: 'OIDC not configured. Set OIDC_ISSUER_URL and OIDC_CLIENT_ID.' })
      }

      try {
        const oidc = await import('openid-client')
        const config = await oidc.discovery(
          new URL(issuerUrl),
          clientId,
          undefined,
          oidc.ClientSecretPost(process.env.OIDC_CLIENT_SECRET ?? ''),
        )

        const codeVerifier = oidc.randomPKCECodeVerifier()
        const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
        const state = oidc.randomState()
        const nonce = oidc.randomNonce()

        if (redisUrl) {
          const { getRedisClient } = await import('@termless/auth')
          const redis = await getRedisClient(redisUrl)
          await redis.set(`termless:oidc:${state}`, JSON.stringify({ codeVerifier, nonce }), {
            EX: 300,
          })
        }

        const redirectUri = `${process.env.API_PUBLIC_URL ?? ''}/auth/oidc/callback`
        const authEndpoint = config.serverMetadata().authorization_endpoint
        if (!authEndpoint) return await reply.code(500).send({ error: 'No authorization endpoint' })
        const authUrl = new URL(authEndpoint)
        authUrl.searchParams.set('client_id', clientId)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('scope', 'openid email profile')
        authUrl.searchParams.set('code_challenge', codeChallenge)
        authUrl.searchParams.set('code_challenge_method', 'S256')
        authUrl.searchParams.set('state', state)
        authUrl.searchParams.set('nonce', nonce)
        authUrl.searchParams.set('redirect_uri', redirectUri)

        return await reply.redirect(authUrl.toString())
      } catch {
        return reply.code(500).send({ error: 'OIDC discovery failed' })
      }
    },
  )

  fastify.get(
    '/auth/oidc/callback',
    {
      schema: { tags: ['auth'], hide: true, description: 'OIDC callback' },
    },
    async (request, reply) => {
      const issuerUrl = process.env.OIDC_ISSUER_URL
      const clientId = process.env.OIDC_CLIENT_ID
      const redirectUri = `${process.env.API_PUBLIC_URL ?? ''}/auth/oidc/callback`

      if (!issuerUrl || !clientId || !redisUrl) {
        return reply.code(501).send({ error: 'OIDC not configured' })
      }

      const query = request.query as Record<string, string | undefined>
      const state = query.state
      if (!state) return reply.code(400).send({ error: 'Missing state' })

      try {
        const { getRedisClient } = await import('@termless/auth')
        const redis = await getRedisClient(redisUrl)
        const stored = await redis.get(`termless:oidc:${state}`)
        if (!stored) return await reply.code(400).send({ error: 'Invalid or expired state' })
        await redis.del(`termless:oidc:${state}`)

        JSON.parse(stored) as {
          codeVerifier: string
          nonce: string
        }

        const oidc = await import('openid-client')
        const config = await oidc.discovery(
          new URL(issuerUrl),
          clientId,
          undefined,
          oidc.ClientSecretPost(process.env.OIDC_CLIENT_SECRET ?? ''),
        )

        const currentUrl = new URL(
          `${redirectUri}?${new URLSearchParams(query as Record<string, string>)}`,
        )
        const tokenResponse = await oidc.authorizationCodeGrant(config, currentUrl, {
          expectedState: state,
        })

        const claims = tokenResponse.claims()
        const email = (claims?.email as string) ?? ''
        const displayName = ((claims?.name as string) ?? email) || ''

        if (!email) return await reply.code(400).send({ error: 'No email in OIDC claims' })

        let user = await fastify.prisma.user.findUnique({ where: { email } })
        if (!user) {
          user = await fastify.prisma.user.create({
            data: { email, displayName, role: 'DEVELOPER' },
          })
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

        authAttemptsTotal.inc({ mode: 'oidc', result: 'success' })
        void fastify.audit(user.id, 'auth.login', { mode: 'oidc' }, request.ip)
        void triggerWebhook(fastify, 'auth.login', { userId: user.id }, user.id)

        const frontendUrl = process.env.FRONTEND_URL ?? '/'
        reply.setCookie('termless_token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: ttlSeconds,
        })
        return await reply.redirect(frontendUrl)
      } catch {
        authAttemptsTotal.inc({ mode: 'oidc', result: 'failure' })
        return reply.code(500).send({ error: 'OIDC callback failed' })
      }
    },
  )

  // TOTP setup for ADMIN/OPERATOR
  fastify.post(
    '/auth/totp/setup',
    {
      schema: {
        tags: ['auth'],
        description: 'Generate TOTP secret for 2FA setup',
      },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Not authenticated' })

      const dbUser = await fastify.prisma.user.findUnique({ where: { id: user.id } })
      if (!dbUser) return reply.code(404).send({ error: 'User not found' })

      if (dbUser.totpSecret) {
        return reply.send({ message: 'TOTP already set up' })
      }

      const { secret, uri } = generateTotpSecret(dbUser.email)
      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { totpSecret: secret },
      })

      return { secret, uri }
    },
  )

  fastify.post(
    '/auth/totp/verify',
    {
      schema: {
        tags: ['auth'],
        description: 'Verify TOTP code and enable 2FA',
        body: {
          type: 'object',
          required: ['totpCode'],
          properties: {
            totpCode: { type: 'string', minLength: 6, maxLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Not authenticated' })

      const body = totpSetupSchema.parse(request.body)
      const dbUser = await fastify.prisma.user.findUnique({ where: { id: user.id } })
      if (!dbUser?.totpSecret) {
        return reply.code(400).send({ error: 'TOTP not set up' })
      }

      if (!verifyTotpCode(dbUser.totpSecret, body.totpCode)) {
        return reply.code(401).send({ error: 'Invalid TOTP code' })
      }

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { totpVerified: true },
      })

      return { ok: true }
    },
  )
}
