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

/* eslint-disable @typescript-eslint/naming-convention */
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

import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'

const webhookEventSchema = z.enum([
  'session.created',
  'session.terminated',
  'session.shared',
  'recording.completed',
  'workspace.created',
  'workspace.deleted',
  'auth.login',
])

const createWebhookSchema = z.object({
  url: z.url(),
  events: z.array(webhookEventSchema),
})

const updateWebhookSchema = createWebhookSchema.partial()

export async function registerWebhookRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/webhooks',
    {
      schema: { tags: ['webhooks'], description: 'List user webhooks' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      return fastify.prisma.webhook.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
    },
  )

  fastify.post(
    '/api/v1/webhooks',
    {
      schema: { tags: ['webhooks'], description: 'Create webhook' },
      config: { rateLimit: { max: 20, timeWindow: '1 minute' } },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const body = createWebhookSchema.parse(request.body)

      const secret = crypto.randomBytes(32).toString('hex')

      const webhook = await fastify.prisma.webhook.create({
        data: {
          userId: user.id,
          url: body.url,
          events: body.events,
          secret,
        },
      })

      void fastify.audit(user.id, 'webhook.create', { webhookId: webhook.id }, request.ip)

      return reply.code(201).send({
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt.toISOString(),
      })
    },
  )

  fastify.put(
    '/api/v1/webhooks/:id',
    {
      schema: { tags: ['webhooks'], description: 'Update webhook' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }
      const body = updateWebhookSchema.parse(request.body)

      const existing = await fastify.prisma.webhook.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return reply.code(404).send({ error: 'Webhook not found' })
      }

      const data: Record<string, unknown> = {}
      if (body.url !== undefined) data.url = body.url
      if (body.events !== undefined) data.events = body.events

      const webhook = await fastify.prisma.webhook.update({
        where: { id },
        data,
      })

      return {
        id: webhook.id,
        url: webhook.url,
        events: webhook.events,
        active: webhook.active,
        createdAt: webhook.createdAt.toISOString(),
        updatedAt: webhook.updatedAt.toISOString(),
      }
    },
  )

  fastify.delete(
    '/api/v1/webhooks/:id',
    {
      schema: { tags: ['webhooks'], description: 'Delete webhook' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const { id } = request.params as { id: string }

      const existing = await fastify.prisma.webhook.findUnique({ where: { id } })
      if (!existing || existing.userId !== user.id) {
        return reply.code(404).send({ error: 'Webhook not found' })
      }

      await fastify.prisma.webhook.delete({ where: { id } })
      void fastify.audit(user.id, 'webhook.delete', { webhookId: id }, request.ip)

      return { ok: true }
    },
  )
}

export async function triggerWebhook(
  fastify: FastifyInstance,
  event: string,
  payload: Record<string, unknown>,
  userId: string,
): Promise<void> {
  const webhooks = await fastify.prisma.webhook.findMany({
    where: { userId, active: true, events: { has: event } },
    select: { url: true, secret: true, id: true },
  })

  for (const webhook of webhooks) {
    try {
      const body = JSON.stringify({ event, payload, timestamp: Date.now() })
      const signature = `sha256=${crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')}`

      await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-termless-signature': signature,
          'x-termless-event': event,
        },
        body,
      })
    } catch {
      // Ignore webhook errors - they are fire-and-forget
    }
  }
}
