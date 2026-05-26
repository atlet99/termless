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

import { createWorkspaceSchema } from '@termless/shared'
import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import path from 'node:path'
import type { FastifyInstance } from 'fastify'
import { requireRole } from '../../plugins/rbac.js'
import { triggerWebhook } from '../webhooks/index.js'

const execAsync = promisify(exec)

const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || '/workspace'

function validateWorkspacePath(workspacePath: string): boolean {
  // Must be within workspace root
  if (!workspacePath.startsWith(WORKSPACE_ROOT)) return false
  // Must not contain path traversal
  if (workspacePath.includes('..')) return false
  // Must not escape to system directories
  const normalized = path.normalize(workspacePath)
  return normalized.startsWith(WORKSPACE_ROOT)
}

async function getGitStatus(
  workspacePath: string,
  systemUid: number,
): Promise<{
  branch: string
  changedFiles: number
}> {
  try {
    const { stdout: branch } = await execAsync(
      `sudo -u termless-user-${systemUid} git -C ${workspacePath} branch --show-current`,
    )
    const { stdout: status } = await execAsync(
      `sudo -u termless-user-${systemUid} git -C ${workspacePath} status --porcelain`,
    )
    return {
      branch: branch.trim(),
      changedFiles: status.split('\n').filter(Boolean).length,
    }
  } catch {
    return { branch: '', changedFiles: 0 }
  }
}

export async function registerWorkspaceRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/workspaces',
    {
      schema: { tags: ['workspaces'], description: 'List workspaces' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request) => {
      const prisma = fastify.prisma
      const userId = request.user?.id
      if (!userId) return []
      const workspaces = await prisma.workspace.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      })
      return workspaces
    },
  )

  fastify.get(
    '/api/v1/workspaces/:id/git-status',
    {
      schema: { tags: ['workspaces'], description: 'Get git status for workspace' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      const prisma = fastify.prisma

      const workspace = await prisma.workspace.findFirst({
        where: { id, userId: user.id },
      })
      if (!workspace) {
        return reply.code(404).send({ error: 'Workspace not found' })
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { systemUid: true },
      })
      const systemUid = dbUser?.systemUid
      if (!systemUid) {
        return reply.code(400).send({ error: 'User not provisioned' })
      }

      const gitStatus = await getGitStatus(workspace.path, systemUid)
      return gitStatus
    },
  )

  fastify.post(
    '/api/v1/workspaces',
    {
      schema: { tags: ['workspaces'], description: 'Create workspace' },
      preHandler: [requireRole('DEVELOPER')],
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const body = createWorkspaceSchema.parse(request.body)
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      const prisma = fastify.prisma

      // Workspace isolation verification
      if (!validateWorkspacePath(body.path)) {
        void fastify.audit(
          user.id,
          'workspace.isolation_violation',
          { path: body.path },
          request.ip,
        )
        return reply.code(403).send({ error: 'Workspace path must be within workspace root' })
      }

      const workspace = await prisma.workspace.create({
        data: {
          userId: user.id,
          name: body.name,
          path: body.path,
        },
      })
      void fastify.audit(user.id, 'workspace.create', { name: body.name }, request.ip)
      void triggerWebhook(fastify, 'workspace.created', { workspaceId: workspace.id }, user.id)
      return reply.code(201).send(workspace)
    },
  )

  fastify.delete(
    '/api/v1/workspaces/:id',
    {
      schema: { tags: ['workspaces'], description: 'Delete workspace' },
      preHandler: [requireRole('DEVELOPER')],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })
      const prisma = fastify.prisma

      const workspace = await prisma.workspace.findFirst({ where: { id, userId: user.id } })
      if (!workspace) return reply.code(404).send({ error: 'Workspace not found' })

      await prisma.workspace.delete({ where: { id } })
      void fastify.audit(user.id, 'workspace.delete', { workspaceId: id }, request.ip)
      void triggerWebhook(fastify, 'workspace.deleted', { workspaceId: id }, user.id)

      return { ok: true }
    },
  )
}
