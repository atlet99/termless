import { httpRequestDuration, httpRequestsTotal, register as promRegister } from '@termless/shared'
import fp from 'fastify-plugin'

function isInternalIP(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('192.168.')
  )
}

export const register = fp(async (fastify) => {
  fastify.addHook('onResponse', (request, reply, done) => {
    const route = request.routeOptions.url ?? request.url.split('?')[0]
    httpRequestsTotal.inc({
      method: request.method,
      route,
      status_code: String(reply.statusCode),
    })
    httpRequestDuration.observe({ method: request.method, route }, reply.elapsedTime / 1000)
    done()
  })

  fastify.get(
    '/metrics',
    {
      schema: { tags: ['system'], hide: true },
      config: { rateLimit: false },
    },
    async (request, reply) => {
      if (!isInternalIP(request.ip)) {
        return reply.code(403).send('Forbidden')
      }
      reply.header('Content-Type', promRegister.contentType)
      return promRegister.metrics()
    },
  )
})

export { isInternalIP }
