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

import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { ToolBadge } from './ToolBadge'

interface Session {
  id: string
  userId: string
  name: string | null
  tool: string
  tmuxSession: string
  ttydPort: number | null
  lastSeenAt: string | null
  createdAt: string
}

function formatUptime(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime()
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ${minutes % 60}m`
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`
  return `${seconds}s`
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '—'
  const ms = Date.now() - new Date(dateStr).getTime()
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return `${seconds}s ago`
}

export function ProcessesPage() {
  const { t } = useTranslation()

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
    refetchInterval: 5000,
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">{t('sidebar.processes')}</h1>
        <span className="text-xs text-[var(--color-text-dim)] font-mono">
          {sessions?.length ?? 0} active
        </span>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-text-dim)] text-sm">{t('common.loading')}</p>
      ) : (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Table header */}
          <div
            className="grid gap-4 px-4 py-2.5 text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider font-medium"
            style={{
              gridTemplateColumns: '80px 100px 1fr 100px 120px 100px',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span>PID</span>
            <span>Tool</span>
            <span>Name</span>
            <span>Uptime</span>
            <span>Last Seen</span>
            <span>Status</span>
          </div>

          {/* Table body */}
          {sessions?.map((session) => (
            <div
              key={session.id}
              className="grid gap-4 px-4 py-3 items-center transition-colors hover:bg-[var(--color-selection-hover)]"
              style={{
                gridTemplateColumns: '80px 100px 1fr 100px 120px 100px',
                borderBottom: '1px solid var(--color-border-muted)',
              }}
            >
              {/* PID */}
              <span className="text-xs text-[var(--color-accent)] font-mono">
                {session.ttydPort ?? '—'}
              </span>

              {/* Tool */}
              <ToolBadge tool={session.tool} />

              {/* Name */}
              <span className="text-sm text-[var(--color-text)] truncate">
                {session.name ?? session.id.slice(0, 12)}
              </span>

              {/* Uptime */}
              <span className="text-xs text-[var(--color-text-dim)] font-mono">
                {formatUptime(session.createdAt)}
              </span>

              {/* Last seen */}
              <span className="text-xs text-[var(--color-text-dim)] font-mono">
                {formatTimeAgo(session.lastSeenAt)}
              </span>

              {/* Status */}
              <span className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: session.lastSeenAt ? 'var(--color-green)' : 'var(--color-text-dim)',
                  }}
                />
                <span className="text-xs text-[var(--color-text-dim)]">
                  {session.lastSeenAt ? 'Running' : 'Idle'}
                </span>
              </span>
            </div>
          ))}

          {(!sessions || sessions.length === 0) && (
            <div className="px-4 py-8 text-center text-[var(--color-text-dim)] text-sm">
              {t('dashboard.noSessions')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
