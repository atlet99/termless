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

import cookie from '@fastify/cookie'
import session from '@fastify/session'
import type { AuthenticatedUser } from '@termless/shared'
import { getSession } from '@termless/auth'
import fp from 'fastify-plugin'

export const register = fp(async (fastify) => {
  await fastify.register(cookie)
  await fastify.register(session, {
    secret: process.env.SESSION_SECRET ?? 'change-me-in-production',
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 8 * 60 * 60 * 1000,
    },
  })

  fastify.decorateRequest('user', undefined as unknown as AuthenticatedUser)

  const redisUrl = process.env.REDIS_URL
  const sessionTtlSeconds = Number(process.env.SESSION_TTL_HOURS ?? 8) * 60 * 60

  fastify.addHook('onRequest', async (request, _reply) => {
    if (!redisUrl) return
    const authHeader = request.headers.authorization
    const cookieToken = request.cookies.termless_session

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const user = await getSession(redisUrl, token, sessionTtlSeconds)
      if (user) {
        request.user = user
        return
      }
    }

    if (cookieToken) {
      const user = await getSession(redisUrl, cookieToken, sessionTtlSeconds)
      if (user) {
        request.user = user
        return
      }
    }
  })
})
