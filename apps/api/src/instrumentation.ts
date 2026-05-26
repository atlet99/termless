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

import { NodeSDK } from '@opentelemetry/sdk-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http'
import { PgInstrumentation } from '@opentelemetry/instrumentation-pg'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

const serviceVersion = process.env.npm_package_version ?? '0.1.0'

/* eslint-disable @typescript-eslint/naming-convention -- OTel semantic convention attributes */
const resource = resourceFromAttributes({
  [ATTR_SERVICE_NAME]: 'termless-api',
  [ATTR_SERVICE_VERSION]: serviceVersion,
  'deployment.environment': process.env.NODE_ENV ?? 'production',
})
/* eslint-enable @typescript-eslint/naming-convention */

const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT ?? 'http://localhost:4318/v1/traces'

const sdk = new NodeSDK({
  resource,
  traceExporter: new OTLPTraceExporter({ url: otlpEndpoint }),
  instrumentations: [
    new HttpInstrumentation(),
    new PgInstrumentation({ enhancedDatabaseReporting: true }),
  ],
})

sdk.start()

process.on('SIGTERM', () => {
  void sdk.shutdown()
})

process.on('SIGINT', () => {
  void sdk.shutdown()
})

export { sdk }
