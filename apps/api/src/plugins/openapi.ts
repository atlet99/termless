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

import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'
import fp from 'fastify-plugin'
import { isInternalIP } from './metrics.js'

const ROLE_VISIBLE_TAGS: Record<string, string[]> = {
  VIEWER: ['auth', 'system'],
  DEVELOPER: ['auth', 'sessions', 'workspaces', 'templates', 'snippets', 'env-vars', 'system'],
  OPERATOR: ['auth', 'sessions', 'workspaces', 'templates', 'snippets', 'env-vars', 'system'],
  ADMIN: [
    'auth',
    'sessions',
    'workspaces',
    'templates',
    'snippets',
    'env-vars',
    'admin',
    'tokens',
    'webhooks',
    'sharing',
    'system',
  ],
}

export const register = fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Termless API',
        description: 'Centralized terminal hub for opencode and claude code',
        version: '1.0.0',
        license: {
          name: 'Apache 2.0',
          url: 'https://github.com/atlet99/termless/blob/main/LICENSE',
        },
        contact: { name: 'Termless', url: 'https://github.com/atlet99/termless' },
      },
      servers: [{ url: process.env.API_PUBLIC_URL ?? '/api', description: 'Current server' }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token from /auth/login or OIDC callback',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'termless_session',
            description: 'Session cookie',
          },
        },
      },
      security: [{ bearerAuth: [] }, { cookieAuth: [] }],
      tags: [
        { name: 'auth', description: 'Authentication and sessions' },
        { name: 'sessions', description: 'Terminal sessions' },
        { name: 'workspaces', description: 'Working directories' },
        { name: 'templates', description: 'Session templates' },
        { name: 'snippets', description: 'Quick commands' },
        { name: 'env-vars', description: 'Environment variables' },
        { name: 'admin', description: 'Administration (ADMIN only)' },
        { name: 'tokens', description: 'Personal API tokens' },
        { name: 'webhooks', description: 'Webhook subscriptions' },
        { name: 'sharing', description: 'Session sharing' },
        { name: 'system', description: 'Healthcheck, metrics' },
      ],
    },
  })

  // Role-scoped OpenAPI spec filtering
  fastify.get(
    '/openapi.json',
    {
      schema: { hide: true },
    },
    async (request, reply) => {
      const spec = fastify.swagger()
      const role = (request.user?.role ?? 'VIEWER') as string
      const allowedTags: string[] = ROLE_VISIBLE_TAGS[role] ??
        ROLE_VISIBLE_TAGS.VIEWER ?? ['auth', 'system']

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

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_UI === 'true') {
    fastify.addHook('onRequest', async (request, reply) => {
      if (!request.url.startsWith('/reference')) return
      if (process.env.NODE_ENV === 'production') {
        const isInternal = isInternalIP(request.ip)
        const isAdmin = request.user?.role === 'ADMIN'
        if (!isInternal && !isAdmin) {
          return reply.code(403).send({ error: 'API reference not available externally' })
        }
      }
    })

    await fastify.register(scalar, {
      routePrefix: '/reference',
      configuration: {
        title: 'Termless API Reference',
        url: '/openapi.json',
        theme: 'purple',
        darkMode: true,
        authentication: {
          preferredSecurityScheme: 'bearerAuth',
        },
      },
    })
  }
})
