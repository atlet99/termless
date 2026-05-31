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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

interface AuditEntry {
  id: string
  userId: string
  action: string
  details: Record<string, unknown> | null
  ip: string | null
  createdAt: string
}

interface AuditResponse {
  data: AuditEntry[]
  pagination: { page: number; limit: number; total: number; pages: number }
}

const inputStyle = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}

export function AuditLog() {
  const { t } = useTranslation()
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const [action, setAction] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const { data, isLoading } = useQuery<AuditResponse>({
    queryKey: ['audit-logs', page, userId, action, from, to],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: '50' })
      if (userId) params.set('userId', userId)
      if (action) params.set('action', action)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return api.get(`/api/v1/admin/audit-logs?${params.toString()}`)
    },
  })

  const escapeCsv = (value: string): string => {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replaceAll('"', '""')}"`
    }
    return value
  }

  const handleExport = async () => {
    const params = new URLSearchParams({ page: '1', limit: '10000' })
    if (userId) params.set('userId', userId)
    if (action) params.set('action', action)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const result = await api.get<AuditResponse>(`/api/v1/admin/audit-logs?${params.toString()}`)
    const rows = result.data.map((e) =>
      [e.createdAt, e.userId, e.action, JSON.stringify(e.details ?? {}), e.ip ?? '']
        .map(escapeCsv)
        .join(','),
    )
    const csv = ['timestamp,userId,action,details,ip', ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">{t('admin.auditLog')}</h1>
        <button
          type="button"
          onClick={handleExport}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
          }}
        >
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 mb-6 p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <input
          placeholder="User ID"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value)
            setPage(1)
          }}
          className="rounded-md px-3 py-2 text-sm outline-none font-mono"
          style={inputStyle}
        />
        <input
          placeholder={t('admin.actionPlaceholder')}
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
        <input
          type="datetime-local"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
        <input
          type="datetime-local"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            setPage(1)
          }}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
      </div>

      {isLoading ? (
        <p className="text-[var(--color-text-dim)]">{t('common.loading')}</p>
      ) : (
        <div
          className="overflow-auto rounded-xl"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <table className="w-full text-left text-sm">
            <thead>
              <tr
                className="text-[var(--color-text-dim)]"
                style={{ borderBottom: '1px solid var(--color-border)' }}
              >
                <th className="p-3">Time</th>
                <th className="p-3">User</th>
                <th className="p-3">Action</th>
                <th className="p-3">Details</th>
                <th className="p-3">IP</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((entry) => (
                <tr
                  key={entry.id}
                  className="text-[var(--color-text)]"
                  style={{ borderBottom: '1px solid var(--color-border-muted)' }}
                >
                  <td className="p-3 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3 font-mono text-xs">{entry.userId}</td>
                  <td className="p-3">
                    <span
                      className="rounded px-1.5 py-0.5 text-xs"
                      style={{
                        background: 'var(--color-surface-3)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-[var(--color-text-dim)]">
                    {entry.details ? JSON.stringify(entry.details) : '—'}
                  </td>
                  <td className="p-3 text-xs text-[var(--color-text-dim)]">{entry.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              setPage((p) => p - 1)
            }}
            className="rounded-md px-3 py-1.5 text-sm border border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-[var(--color-text-dim)]">
            {page} / {data.pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= data.pagination.pages}
            onClick={() => {
              setPage((p) => p + 1)
            }}
            className="rounded-md px-3 py-1.5 text-sm border border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
