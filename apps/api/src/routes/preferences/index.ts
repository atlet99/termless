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

import { z } from 'zod'
import type { FastifyInstance } from 'fastify'

const updatePreferencesSchema = z.object({
  terminalTheme: z
    .enum(['tokyo-night', 'dracula', 'one-dark', 'solarized-dark', 'nord'])
    .optional(),
  terminalFont: z
    .enum(['JetBrains Mono', 'Cascadia Code', 'Fira Code', 'IBM Plex Mono'])
    .optional(),
  terminalSize: z.number().min(12).max(20).optional(),
  cursorStyle: z.enum(['block', 'underline', 'bar']).optional(),
  layoutMode: z.enum(['popup', 'embedded']).optional(),
})

export async function registerPreferencesRoutes(fastify: FastifyInstance) {
  fastify.get(
    '/api/v1/me/preferences',
    {
      schema: { tags: ['preferences'], description: 'Get current user preferences' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const prefs = await fastify.prisma.userPreference.findUnique({
        where: { userId: user.id },
      })

      return (
        prefs ?? {
          terminalTheme: 'tokyo-night',
          terminalFont: 'JetBrains Mono',
          terminalSize: 15,
          cursorStyle: 'block',
          layoutMode: 'popup',
        }
      )
    },
  )

  fastify.patch(
    '/api/v1/me/preferences',
    {
      schema: { tags: ['preferences'], description: 'Update current user preferences' },
    },
    async (request, reply) => {
      const user = request.user
      if (!user) return reply.code(401).send({ error: 'Unauthorized' })

      const body = updatePreferencesSchema.parse(request.body)

      const data: Record<string, unknown> = {}
      if (body.terminalTheme !== undefined) data.terminalTheme = body.terminalTheme
      if (body.terminalFont !== undefined) data.terminalFont = body.terminalFont
      if (body.terminalSize !== undefined) data.terminalSize = body.terminalSize
      if (body.cursorStyle !== undefined) data.cursorStyle = body.cursorStyle
      if (body.layoutMode !== undefined) data.layoutMode = body.layoutMode

      const prefs = await fastify.prisma.userPreference.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data },
        update: data,
      })

      return prefs
    },
  )
}
