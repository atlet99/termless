import cookie from '@fastify/cookie'
import session from '@fastify/session'
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

  fastify.decorateRequest('user', null)

  fastify.addHook('onRequest', async (request, _reply) => {
    const authHeader = request.headers.authorization
    const cookieToken = request.cookies.termless_session

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7)
      const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
      const user = await getSession(redisUrl, token)
      if (user) {
        request.user = user
        return
      }
    }

    if (cookieToken) {
      const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379'
      const user = await getSession(redisUrl, cookieToken)
      if (user) {
        request.user = user
        return
      }
    }
  })
})
