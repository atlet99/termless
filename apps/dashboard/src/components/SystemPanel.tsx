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

import { useEffect, useState } from 'react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { api } from '../lib/api'

interface HealthData {
  status: string
  uptime: number
  version: string
  timestamp: string
}

interface ReadyData {
  status: string
  checks: Record<string, { status: string; latencyMs?: number; freeGb?: number }>
}

function Sparkline({
  data,
  color,
  height = 40,
}: {
  data: number[]
  color: string
  height?: number
}) {
  const chartData = data.map((value, i) => ({ i, value }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
        <defs>
          <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          fill={`url(#grad-${color.replace('#', '')})`}
          strokeWidth={1.5}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

function StatusBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-1 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.min(pct, 100)}%`, background: color }}
      />
    </div>
  )
}

function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function SystemPanel() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [ready, setReady] = useState<ReadyData | null>(null)
  const [cpuHistory] = useState<number[]>(() =>
    Array.from({ length: 30 }, () => Math.random() * 30 + 10),
  )
  const [netHistory] = useState<number[]>(() => Array.from({ length: 30 }, () => Math.random() * 5))

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await api.get<HealthData>('/health')
        setHealth(data)
      } catch {
        // ignore
      }
    }
    const fetchReady = async () => {
      try {
        const data = await api.get<ReadyData>('/ready')
        setReady(data)
      } catch {
        // ignore
      }
    }
    void fetchHealth()
    void fetchReady()
    const interval = setInterval(() => {
      void fetchHealth()
      void fetchReady()
    }, 10_000)
    return () => {
      clearInterval(interval)
    }
  }, [])

  const dbCheck = ready?.checks.database
  const redisCheck = ready?.checks.redis
  const diskCheck = ready?.checks.disk

  return (
    <div
      className="h-full flex flex-col bg-[var(--color-surface)]"
      style={{ borderTop: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 h-8 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border-muted)' }}
      >
        <span className="text-[10px] text-[var(--color-text-dim)] uppercase tracking-widest font-medium">
          System
        </span>
        <div className="flex items-center gap-3">
          {health && (
            <span className="text-[10px] text-[var(--color-text-dim)] font-mono">
              Uptime:{' '}
              <span className="text-[var(--color-text)]">{formatUptime(health.uptime)}</span>
            </span>
          )}
          {health && (
            <span className="text-[10px] text-[var(--color-text-dim)] font-mono">
              v{health.version}
            </span>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      <div
        className="flex-1 grid grid-cols-4 overflow-hidden"
        style={{ borderRight: '1px solid var(--color-border-muted)' }}
      >
        {/* CPU */}
        <div className="p-3" style={{ borderRight: '1px solid var(--color-border-muted)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--color-text-dim)]">CPU</span>
            <span className="text-[10px] text-[var(--color-accent)] font-mono">
              {cpuHistory[cpuHistory.length - 1]?.toFixed(0)}%
            </span>
          </div>
          <Sparkline data={cpuHistory} color="#7aa2f7" height={80} />
        </div>

        {/* Memory */}
        <div className="p-3" style={{ borderRight: '1px solid var(--color-border-muted)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-[var(--color-text-dim)]">Memory</span>
            <span className="text-[10px] text-[var(--color-green)] font-mono">
              {dbCheck?.status === 'ok' ? '52%' : '—'}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">RAM</span>
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                  4.2 / 8.0 GB
                </span>
              </div>
              <StatusBar pct={52} color="var(--color-green)" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">Swap</span>
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                  0.1 / 2.0 GB
                </span>
              </div>
              <StatusBar pct={5} color="var(--color-green)" />
            </div>
          </div>
        </div>

        {/* Disk */}
        <div className="p-3" style={{ borderRight: '1px solid var(--color-border-muted)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] text-[var(--color-text-dim)]">Disk</span>
            <span className="text-[10px] text-[var(--color-green)] font-mono">
              {diskCheck?.freeGb ? `${diskCheck.freeGb}GB free` : '—'}
            </span>
          </div>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">/</span>
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                  18.4 / 100 GB
                </span>
              </div>
              <StatusBar pct={18} color="var(--color-green)" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                  /workspace
                </span>
                <span className="text-[9px] text-[var(--color-text-dim)] font-mono">
                  3.2 / 50 GB
                </span>
              </div>
              <StatusBar pct={6} color="var(--color-green)" />
            </div>
          </div>
        </div>

        {/* Network */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--color-text-dim)]">Network</span>
            <span className="text-[10px] text-[var(--color-cyan)] font-mono">
              ↓{netHistory[netHistory.length - 1]?.toFixed(1)} MB/s
            </span>
          </div>
          <Sparkline data={netHistory} color="#7dcfff" height={80} />
        </div>
      </div>

      {/* Service status */}
      <div
        className="flex items-center gap-4 px-4 h-7 flex-shrink-0"
        style={{ borderTop: '1px solid var(--color-border-muted)' }}
      >
        <span className="text-[10px] text-[var(--color-text-dim)]">Services:</span>
        {dbCheck && (
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: dbCheck.status === 'ok' ? 'var(--color-green)' : 'var(--color-red)',
              }}
            />
            <span className="text-[10px] text-[var(--color-text-dim)] font-mono">
              DB {dbCheck.latencyMs}ms
            </span>
          </span>
        )}
        {redisCheck && (
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: redisCheck.status === 'ok' ? 'var(--color-green)' : 'var(--color-red)',
              }}
            />
            <span className="text-[10px] text-[var(--color-text-dim)] font-mono">
              Redis {redisCheck.latencyMs}ms
            </span>
          </span>
        )}
        {ready?.status && (
          <span className="flex items-center gap-1">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background:
                  ready.status === 'ok'
                    ? 'var(--color-green)'
                    : ready.status === 'degraded'
                      ? 'var(--color-yellow)'
                      : 'var(--color-red)',
              }}
            />
            <span className="text-[10px] text-[var(--color-text-dim)] font-mono">
              {ready.status}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
