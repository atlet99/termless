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

import fp from 'fastify-plugin'

export const register = fp(async (fastify) => {
  fastify.decorate(
    'audit',
    async (
      userId: string,
      action: string,
      metadata?: Record<string, unknown> | null,
      ip?: string,
    ) => {
      const data: Record<string, unknown> = { userId, action }
      if (metadata) data.metadata = metadata
      if (ip) data.ip = ip
      await fastify.prisma.auditLog.create({ data: data as any })
    },
  )
})
