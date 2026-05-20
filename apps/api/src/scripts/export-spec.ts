import Fastify from 'fastify'
import { register as registerOpenapi } from '../plugins/openapi.js'
import { registerAdminRoutes } from '../routes/admin/index.js'
import { registerAuthRoutes } from '../routes/auth/index.js'
import { registerSessionRoutes } from '../routes/sessions/index.js'
import { registerSystemRoutes } from '../routes/system/index.js'
import { registerWorkspaceRoutes } from '../routes/workspaces/index.js'

async function main() {
  const fastify = Fastify({ logger: false })

  await registerOpenapi(fastify)
  await registerSystemRoutes(fastify)
  await registerAuthRoutes(fastify)
  await registerSessionRoutes(fastify)
  await registerWorkspaceRoutes(fastify)
  await registerAdminRoutes(fastify)

  const spec = fastify.swagger()
  process.stdout.write(JSON.stringify(spec, null, 2))

  await fastify.close()
}

main()
