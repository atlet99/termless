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

import { Counter, Gauge, Histogram, collectDefaultMetrics } from 'prom-client'

collectDefaultMetrics({ prefix: 'termless_' })

export const httpRequestsTotal = new Counter({
  name: 'termless_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
})

export const httpRequestDuration = new Histogram({
  name: 'termless_http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
})

export const authAttemptsTotal = new Counter({
  name: 'termless_auth_attempts_total',
  help: 'Authentication attempts',
  labelNames: ['mode', 'result'],
})

export const activeSessionsTotal = new Gauge({
  name: 'termless_active_sessions_total',
  help: 'Currently active terminal sessions',
  labelNames: ['tool', 'role'],
})

export const terminalConnectionsTotal = new Counter({
  name: 'termless_terminal_connections_total',
  help: 'Total WebSocket terminal connections',
  labelNames: ['tool'],
})

export const terminalDuration = new Histogram({
  name: 'termless_terminal_session_duration_seconds',
  help: 'Terminal session duration in seconds',
  labelNames: ['tool'],
  buckets: [60, 300, 600, 1800, 3600, 7200, 14_400],
})

export const workerProcessesTotal = new Gauge({
  name: 'termless_worker_processes_total',
  help: 'Total worker processes (ttyd instances)',
  labelNames: ['tool'],
})

export const dbConnectionPoolSize = new Gauge({
  name: 'termless_db_connection_pool_size',
  help: 'PostgreSQL connection pool active connections',
})

export const terminalReconnectsTotal = new Counter({
  name: 'termless_terminal_reconnects_total',
  help: 'Total terminal WebSocket reconnects',
  labelNames: ['tool'],
})

export const workerSpawnDuration = new Histogram({
  name: 'termless_worker_spawn_duration_seconds',
  help: 'Worker process spawn duration',
  labelNames: ['tool'],
  buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10],
})

export const workerCrashesTotal = new Counter({
  name: 'termless_worker_crashes_total',
  help: 'Total worker process crashes',
  labelNames: ['tool'],
})

export const authSessionsActive = new Gauge({
  name: 'termless_auth_sessions_active',
  help: 'Currently active HTTP auth sessions',
})

export const totpVerificationsTotal = new Counter({
  name: 'termless_totp_verifications_total',
  help: 'Total TOTP verification attempts',
  labelNames: ['result'],
})

export const dbQueriesTotal = new Counter({
  name: 'termless_db_queries_total',
  help: 'Total database queries',
  labelNames: ['operation', 'table'],
})

export const dbQueryDuration = new Histogram({
  name: 'termless_db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
})

export const redisOperationsTotal = new Counter({
  name: 'termless_redis_operations_total',
  help: 'Total Redis operations',
  labelNames: ['operation', 'result'],
})

export const redisOperationDuration = new Histogram({
  name: 'termless_redis_operation_duration_seconds',
  help: 'Redis operation duration',
  labelNames: ['operation'],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1],
})

export const shareLinksCreatedTotal = new Counter({
  name: 'termless_share_links_created_total',
  help: 'Total share links created',
  labelNames: ['mode'],
})

export const recordingsCreatedTotal = new Counter({
  name: 'termless_recordings_created_total',
  help: 'Total recordings created',
})

export const recordingsStorageBytes = new Gauge({
  name: 'termless_recordings_storage_bytes',
  help: 'Total recordings storage size in bytes',
})

export { register } from 'prom-client'
