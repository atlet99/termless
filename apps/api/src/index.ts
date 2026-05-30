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

import './instrumentation.js'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from '@fastify/type-provider-zod'
import websocket from '@fastify/websocket'
import Fastify from 'fastify'
import { trace } from '@opentelemetry/api'
import { register as registerAudit } from './plugins/audit.js'
import { register as registerAuth } from './plugins/auth.js'
import { register as registerHelmet } from './plugins/helmet.js'
import { register as registerMetrics } from './plugins/metrics.js'
import { register as registerOpenapi } from './plugins/openapi.js'
import { register as registerRbac } from './plugins/rbac.js'
import { registerAdminRoutes } from './routes/admin/index.js'
import { registerAuthRoutes } from './routes/auth/index.js'
import { registerInviteRoutes } from './routes/invite/index.js'
import { registerPreferencesRoutes } from './routes/preferences/index.js'
import { registerRecordingRoutes } from './routes/recordings/index.js'
import { registerSessionRoutes } from './routes/sessions/index.js'
import { registerShareRoutes } from './routes/share/index.js'
import { registerSnippetRoutes } from './routes/snippets/index.js'
import { registerSystemRoutes } from './routes/system/index.js'
import { registerTokenRoutes } from './routes/tokens/index.js'
import { registerNotificationRoutes } from './routes/events/index.js'
import { registerEnvVariableRoutes } from './routes/env-vars/index.js'
import { registerWorkspaceRoutes } from './routes/workspaces/index.js'
import { registerTemplateRoutes } from './routes/templates/index.js'
import { registerWebhookRoutes } from './routes/webhooks/index.js'
import { registerShareWs } from './ws/share-viewer.js'
import { registerTerminalWs } from './ws/terminal.js'

const PORT = Number(process.env.PORT) || 3000
const HOST = process.env.HOST ?? '0.0.0.0'

async function main() {
  const loggerConfig: Record<string, unknown> = {
    level: process.env.LOG_LEVEL ?? 'info',
    formatters: {
      log(object: Record<string, unknown>) {
        const span = trace.getActiveSpan()
        if (!span) return object
        const ctx = span.spanContext()
        return {
          ...object,
          traceId: ctx.traceId,
          spanId: ctx.spanId,
        }
      },
    },
    ...(process.env.NODE_ENV === 'development'
      ? {
          transport: {
            target: 'pino-pretty',
            options: { translateTime: 'HH:MM:ss Z', ignore: 'pid,hostname' },
          },
        }
      : {}),
  }

  const fastify = Fastify({ logger: loggerConfig }).withTypeProvider<ZodTypeProvider>()
  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  })
  fastify.decorate('prisma', prisma)

  await fastify.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? (process.env.API_PUBLIC_URL ?? false) : true,
    credentials: true,
  })

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    ban: 3,
    keyGenerator: (req) => {
      const ip = req.ip ?? 'unknown'
      const forwarded = req.headers['x-forwarded-for']
      if (typeof forwarded === 'string' && forwarded.length > 0) {
        const parts = forwarded.split(',')
        return parts[0]?.trim() ?? ip
      }
      return ip
    },
  })

  await fastify.register(websocket)

  await registerHelmet(fastify)
  await registerOpenapi(fastify)
  await registerMetrics(fastify)
  await registerAuth(fastify)
  await registerRbac(fastify)
  await registerAudit(fastify)

  fastify.addHook('onRequest', async (request) => {
    const span = trace.getActiveSpan()
    if (span && request.user) {
      /* eslint-disable @typescript-eslint/naming-convention -- OTel custom attributes */
      span.setAttributes({
        'termless.user.id': request.user.id,
        'termless.user.role': request.user.role,
      })
      /* eslint-enable @typescript-eslint/naming-convention */
    }
  })

  await registerSystemRoutes(fastify)
  await registerNotificationRoutes(fastify)
  await registerAuthRoutes(fastify)
  await registerTokenRoutes(fastify)
  await registerEnvVariableRoutes(fastify)
  await registerSessionRoutes(fastify)
  await registerWorkspaceRoutes(fastify)
  await registerPreferencesRoutes(fastify)
  await registerSnippetRoutes(fastify)
  await registerShareRoutes(fastify)
  await registerInviteRoutes(fastify)
  await registerRecordingRoutes(fastify)
  await registerAdminRoutes(fastify)
  await registerTemplateRoutes(fastify)
  await registerWebhookRoutes(fastify)
  await registerTerminalWs(fastify)
  await registerShareWs(fastify)

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

main().catch((err: unknown) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
