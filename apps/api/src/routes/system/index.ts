import type { FastifyInstance } from 'fastify'

export async function registerSystemRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/health',
    {
      schema: { tags: ['system'], description: 'Liveness probe' },
    },
    async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    },
  )

  fastify.get(
    '/ready',
    {
      schema: { tags: ['system'], description: 'Readiness probe' },
    },
    async (_request, reply) => {
      try {
        const prisma = (fastify as any).prisma
        await prisma.$queryRaw`SELECT 1`
        return { status: 'ready', timestamp: new Date().toISOString() }
      } catch {
        return reply.code(503).send({ status: 'not ready' })
      }
    },
  )

  fastify.get(
    '/openapi.json',
    {
      schema: { hide: true },
    },
    async (request, reply) => {
      const spec = fastify.swagger()

      const ROLE_VISIBLE_TAGS: Record<string, string[]> = {
        VIEWER: ['auth', 'system'],
        DEVELOPER: ['auth', 'sessions', 'workspaces', 'system'],
        OPERATOR: ['auth', 'sessions', 'workspaces', 'system'],
        ADMIN: ['auth', 'sessions', 'workspaces', 'admin', 'system'],
      }

      const role = (request as any).user?.role ?? 'VIEWER'
      const allowedTags = ROLE_VISIBLE_TAGS[role] ?? ROLE_VISIBLE_TAGS.VIEWER

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
}
