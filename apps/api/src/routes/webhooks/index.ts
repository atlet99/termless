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

function isInternalOrPrivateUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString)
    const hostname = url.hostname

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true

    // Block private IP ranges
    const ipv4Match = /^(\d{1,3})\.(\d{1,3})(?:\.\d{1,3}){2}$/.exec(hostname)
    if (ipv4Match) {
      const a = Number(ipv4Match[1])
      const b = Number(ipv4Match[2])
      // 10.0.0.0/8
      if (a === 10) return true
      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return true
      // 192.168.0.0/16
      if (a === 192 && b === 168) return true
      // 169.254.0.0/16 (link-local / cloud metadata)
      if (a === 169 && b === 254) return true
    }

    // Block IPv6 private ranges
    if (hostname.startsWith('fd') || hostname.startsWith('fc') || hostname === '::1') return true

    return false
  } catch {
    return true // Invalid URL = block
  }
}

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

      // SSRF protection: block internal/private URLs
      if (isInternalOrPrivateUrl(body.url)) {
        return reply
          .code(400)
          .send({ error: 'Webhook URL cannot target internal or private addresses' })
      }

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
    // SSRF protection: skip internal/private URLs
    if (isInternalOrPrivateUrl(webhook.url)) continue

    const body = JSON.stringify({ event, payload, timestamp: Date.now() })
    const signature = `sha256=${crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')}`

    await fetch(webhook.url, {
      method: 'POST',
      /* eslint-disable @typescript-eslint/naming-convention -- HTTP headers must be lowercase */
      headers: {
        'content-type': 'application/json',
        'x-termless-signature': signature,
        'x-termless-event': event,
      },
      /* eslint-enable @typescript-eslint/naming-convention */
      body,
    }).catch(() => {
      // Ignore webhook errors - they are fire-and-forget
    })
  }
}
