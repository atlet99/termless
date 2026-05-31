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

import { httpRequestDuration, httpRequestsTotal, register as promRegister } from '@termless/shared'
import fp from 'fastify-plugin'

function isInternalIP(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    (ip.startsWith('172.') &&
      (() => {
        const second = Number(ip.split('.')[1])
        return second >= 16 && second <= 31
      })()) ||
    ip.startsWith('192.168.')
  )
}

export const register = fp(async (fastify) => {
  fastify.addHook('onResponse', (request, reply, done) => {
    const route = request.routeOptions.url ?? request.url.split('?')[0] ?? 'unknown'
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
