import type { PrismaClient } from '@prisma/client'
import fp from 'fastify-plugin'

export const register = fp(async (fastify) => {
  fastify.decorate(
    'audit',
    async (userId: string, action: string, metadata?: Record<string, unknown>, ip?: string) => {
      const prisma = fastify.prisma as PrismaClient
      await prisma.auditLog.create({
        data: { userId, action, metadata: metadata ?? undefined, ip },
      })
    },
  )
})
