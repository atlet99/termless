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

import { PrismaClient } from '@prisma/client'
import Fastify from 'fastify'
import { register as registerAudit } from './plugins/audit.js'
import { register as registerAuth } from './plugins/auth.js'
import { register as registerHelmet } from './plugins/helmet.js'
import { register as registerMetrics } from './plugins/metrics.js'
import { register as registerOpenapi } from './plugins/openapi.js'
import { register as registerRbac } from './plugins/rbac.js'
import { registerAdminRoutes } from './routes/admin/index.js'
import { registerAuthRoutes } from './routes/auth/index.js'
import { registerSessionRoutes } from './routes/sessions/index.js'
import { registerSystemRoutes } from './routes/system/index.js'
import { registerWorkspaceRoutes } from './routes/workspaces/index.js'
import { registerTerminalWs } from './ws/terminal.js'

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST ?? '0.0.0.0'

async function main() {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
            }
          : undefined,
    },
  })

  const prisma = new PrismaClient()
  fastify.decorate('prisma', prisma)

  await registerHelmet(fastify)
  await registerOpenapi(fastify)
  await registerMetrics(fastify)
  await registerAuth(fastify)
  await registerRbac(fastify)
  await registerAudit(fastify)

  await registerSystemRoutes(fastify)
  await registerAuthRoutes(fastify)
  await registerSessionRoutes(fastify)
  await registerWorkspaceRoutes(fastify)
  await registerAdminRoutes(fastify)
  await registerTerminalWs(fastify)

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  try {
    await fastify.listen({ port: PORT, host: HOST })
    fastify.log.info(`Termless API listening on ${HOST}:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

main()
