import helmet from '@fastify/helmet'
import fp from 'fastify-plugin'

export const register = fp(async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: false,
  })
})
