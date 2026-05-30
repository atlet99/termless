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

import { createSessionSchema, execCommandSchema, patchSessionSchema } from '@termless/shared'
import { activeSessionsTotal } from '@termless/shared'
import { provisionOsUser, startTtyd } from '@termless/worker'
import type { FastifyInstance } from 'fastify'
import { eventBus } from '../../lib/event-bus.js'
import { requireRole } from '../../plugins/rbac.js'
import { triggerWebhook } from '../webhooks/index.js'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const SYSTEM_UID_MIN = 2000
const SYSTEM_UID_MAX = 60000
const DEFAULT_DISK_QUOTA_MB = 1024 // 1GB default

/**
 * Checks disk usage against quota for a user's workspace using dust
 */
async function checkDiskQuota(
  workspacePath: string,
  quotaMb: number,
): Promise<{ allowed: boolean; usageMb: number }> {
  try {
    // Use dust for faster disk usage calculation
    // dust -o m outputs size in MiB (e.g., "1024.5 /path")
    const { stdout } = await execFileAsync('dust', [
      '-o',
      'm',
      '--skip-total',
      workspacePath,
    ]).catch(() => ({ stdout: '0 /' }))
    // Parse: "1024.5 /path" or "1.2G /path"
    const match = stdout
      .split('\n')[0]
      ?.trim()
      .match(/^([\d.]+)\s/)
    const usageMb = match?.[1] ? Math.ceil(Number.parseFloat(match[1])) : 0
    return { allowed: usageMb < quotaMb, usageMb }
  } catch {
    return { allowed: true, usageMb: 0 }
  }
}

async function getDiskQuotaMb(): Promise<number> {
  return Number(process.env.DISK_QUOTA_MB) || DEFAULT_DISK_QUOTA_MB
}

export async function registerSessionRoutes(fastify: FastifyInstance) {
  const workspaceRoot = process.env.WORKSPACE_ROOT || '/workspace'

  fastify.get(
    '/api/v1/sessions',
    {
      schema: { tags: ['sessions'], description: 'List user sessions' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request) => {
      const prisma = fastify.prisma
      const userId = request.user?.id
      if (!userId) return []
      const sessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      return sessions
    },
  )

  fastify.post(
    '/api/v1/sessions',
    {
      schema: { tags: ['sessions'], description: 'Create terminal session' },
      preHandler: [requireRole('DEVELOPER')],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const body = createSessionSchema.parse(request.body)
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      const prisma = fastify.prisma

      // If templateId provided, use template values as defaults
      let resolvedTool = body.tool
      let resolvedName = body.name
      let resolvedWorkspaceId = body.workspaceId

      if (body.templateId) {
        const template = await prisma.sessionTemplate.findFirst({
          where: { id: body.templateId, userId: user.id },
        })
        if (template) {
          resolvedTool = template.tool
          resolvedName = resolvedName ?? template.name
          resolvedWorkspaceId = resolvedWorkspaceId ?? undefined
        }
      }

      const maxSessions = Number(process.env.MAX_SESSIONS_PER_USER) || 5
      const currentCount = await prisma.session.count({ where: { userId: user.id } })
      if (currentCount >= maxSessions) {
        return reply.code(429).send({ error: 'Session limit reached' })
      }

      let systemUid = user.systemUid

      if (!systemUid) {
        /* eslint-disable @typescript-eslint/naming-convention -- Prisma aggregate API */
        const maxResult = await prisma.user.aggregate({
          _max: { systemUid: true },
        })
        /* eslint-enable @typescript-eslint/naming-convention */
        const nextUid = Math.max(
          SYSTEM_UID_MIN,
          (maxResult._max.systemUid || SYSTEM_UID_MIN - 1) + 1,
        )
        if (nextUid > SYSTEM_UID_MAX) {
          return reply.code(503).send({ error: 'User capacity exhausted' })
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { systemUid: nextUid },
        })
        systemUid = nextUid
      }

      let workspacePath = `${workspaceRoot}/termless-user-${systemUid}`

      if (resolvedWorkspaceId) {
        const workspace = await prisma.workspace.findFirst({
          where: { id: resolvedWorkspaceId, userId: user.id },
        })
        if (workspace?.path.startsWith(workspaceRoot)) {
          workspacePath = workspace.path
        }
      }

      // Check disk quota before provisioning
      const quotaMb = await getDiskQuotaMb()
      const { allowed, usageMb } = await checkDiskQuota(workspacePath, quotaMb)
      if (!allowed) {
        return reply.code(507).send({
          error: 'Disk quota exceeded',
          usageMb,
          quotaMb,
        })
      }

      await provisionOsUser(systemUid, workspacePath, user.role)

      const session = await prisma.session.create({
        data: {
          userId: user.id,
          name: resolvedName ?? null,
          notes: body.notes ?? null,
          tool: resolvedTool,
          tmuxSession: `termless-${systemUid}-${resolvedTool}-${Date.now()}`,
          lastSeenAt: new Date(),
        },
      })

      const port = 10000 + Math.floor(Math.random() * 50000)
      startTtyd({
        port,
        userId: systemUid,
        tmuxSession: session.tmuxSession,
        workspacePath,
      })
      await prisma.session.update({
        where: { id: session.id },
        data: { ttydPort: port },
      })

      activeSessionsTotal.inc({ tool: body.tool, role: user.role })
      void fastify.audit(user.id, 'session.create', { tool: body.tool }, request.ip)
      void triggerWebhook(fastify, 'session.created', { sessionId: session.id }, user.id)
      eventBus.publish(user.id, {
        type: 'session.created',
        timestamp: new Date().toISOString(),
        data: { sessionId: session.id, tool: body.tool },
      })

      return {
        id: session.id,
        tool: session.tool,
        tmuxSession: session.tmuxSession,
        wsUrl: `/ws/terminal/${session.id}`,
      }
    },
  )

  fastify.delete(
    '/api/v1/sessions/:id',
    {
      schema: { tags: ['sessions'], description: 'Delete session' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      const prisma = fastify.prisma

      const session = await prisma.session.findUnique({ where: { id } })
      if (!session) {
        return reply.code(404).send({ error: 'Session not found' })
      }
      if (session.userId !== user.id && user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      if (session.ttydPort) {
        const { stopTtyd } = await import('@termless/worker')
        stopTtyd(session.ttydPort)
      }

      await prisma.session.delete({ where: { id } })

      const remainingSessions = await prisma.session.count({
        where: { userId: session.userId },
      })
      if (remainingSessions === 0) {
        const sessionUser = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { systemUid: true },
        })
        if (sessionUser?.systemUid) {
          const { removeSudoersFile } = await import('@termless/worker')
          await removeSudoersFile(sessionUser.systemUid)
        }
      }

      activeSessionsTotal.dec({ tool: session.tool, role: user.role })
      void fastify.audit(user.id, 'session.delete', { sessionId: id }, request.ip)
      void triggerWebhook(fastify, 'session.terminated', { sessionId: id }, user.id)
      eventBus.publish(user.id, {
        type: 'session.terminated',
        timestamp: new Date().toISOString(),
        data: { sessionId: id },
      })

      return { ok: true }
    },
  )

  fastify.post(
    '/api/v1/sessions/:id/exec',
    {
      schema: { tags: ['sessions'], description: 'Execute command in terminal session' },
      preHandler: [requireRole('DEVELOPER')],
      config: { rateLimit: { max: 30, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const body = execCommandSchema.parse(request.body)

      const prisma = fastify.prisma
      const session = await prisma.session.findUnique({ where: { id } })
      if (!session) return reply.code(404).send({ error: 'Session not found' })
      if (session.userId !== user.id && user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      const sessionUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { systemUid: true },
      })
      if (!sessionUser?.systemUid) {
        return reply.code(500).send({ error: 'User system account not found' })
      }

      const sudoUser = `termless-user-${sessionUser.systemUid}`
      execFileAsync('sudo', [
        '-u',
        sudoUser,
        'tmux',
        'send-keys',
        '-t',
        session.tmuxSession,
        body.command,
        'Enter',
      ]).catch(() => {
        // Fire-and-forget: tmux send-keys may fail if session is dead
      })

      void fastify.audit(
        user.id,
        'session.exec',
        { sessionId: id, command: body.command },
        request.ip,
      )

      return { ok: true }
    },
  )

  fastify.patch(
    '/api/v1/sessions/:id',
    {
      schema: { tags: ['sessions'], description: 'Update session name/notes' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const body = patchSessionSchema.parse(request.body)
      const prisma = fastify.prisma

      const session = await prisma.session.findUnique({ where: { id } })
      if (!session) return reply.code(404).send({ error: 'Session not found' })
      if (session.userId !== user.id && user.role !== 'ADMIN') {
        return reply.code(403).send({ error: 'Forbidden' })
      }

      const data: Record<string, unknown> = {}
      if (body.name !== undefined) data.name = body.name
      if (body.notes !== undefined) data.notes = body.notes

      const updated = await prisma.session.update({ where: { id }, data })
      return updated
    },
  )
}
