import swagger from '@fastify/swagger'
import scalar from '@scalar/fastify-api-reference'
import fp from 'fastify-plugin'

export const register = fp(async (fastify) => {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'Termless API',
        description: 'Centralized terminal hub for opencode and claude code',
        version: '1.0.0',
        license: { name: 'Apache 2.0', url: 'https://www.apache.org/licenses/LICENSE-2.0' },
      },
      servers: [
        { url: process.env.API_PUBLIC_URL ?? '/api', description: 'Current server' },
      ],
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
        { name: 'admin', description: 'Administration (ADMIN only)' },
        { name: 'system', description: 'Healthcheck, metrics' },
      ],
    },
  })

  if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_API_UI === 'true') {
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
