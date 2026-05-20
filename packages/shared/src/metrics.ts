import { Counter, Gauge, Histogram, collectDefaultMetrics, register } from 'prom-client'

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
  buckets: [60, 300, 600, 1800, 3600, 7200, 14400],
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

export { register }
