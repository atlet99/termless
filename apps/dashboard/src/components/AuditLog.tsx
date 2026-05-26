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

export function AuditLog() {
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

  const handleExport = async () => {
    const params = new URLSearchParams({ page: '1', limit: '10000' })
    if (userId) params.set('userId', userId)
    if (action) params.set('action', action)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const result = await api.get<AuditResponse>(`/api/v1/admin/audit-logs?${params.toString()}`)
    const rows = result.data.map((e) => [
      e.createdAt,
      e.userId,
      e.action,
      JSON.stringify(e.details ?? {}),
      e.ip ?? '',
    ])
    const csv = ['timestamp,userId,action,details,ip', ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'audit-log.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Audit Log</h2>
        <button
          type="button"
          onClick={handleExport}
          className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500"
        >
          Export CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          placeholder="User ID"
          value={userId}
          onChange={(e) => {
            setUserId(e.target.value)
            setPage(1)
          }}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <input
          placeholder="Action (e.g. auth.login)"
          value={action}
          onChange={(e) => {
            setAction(e.target.value)
            setPage(1)
          }}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <input
          type="datetime-local"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value)
            setPage(1)
          }}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <input
          type="datetime-local"
          value={to}
          onChange={(e) => {
            setTo(e.target.value)
            setPage(1)
          }}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-700 text-gray-400">
                <th className="p-2">Time</th>
                <th className="p-2">User</th>
                <th className="p-2">Action</th>
                <th className="p-2">Details</th>
                <th className="p-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {data?.data.map((entry) => (
                <tr key={entry.id} className="border-b border-gray-800 text-gray-200">
                  <td className="p-2 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 font-mono text-xs">{entry.userId}</td>
                  <td className="p-2">
                    <span className="rounded bg-gray-700 px-1.5 py-0.5 text-xs">
                      {entry.action}
                    </span>
                  </td>
                  <td className="p-2 font-mono text-xs text-gray-400">
                    {entry.details ? JSON.stringify(entry.details) : '—'}
                  </td>
                  <td className="p-2 text-xs text-gray-400">{entry.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && data.pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => {
              setPage((p) => p - 1)
            }}
            className="rounded bg-gray-700 px-2 py-1 text-sm text-white disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-gray-400">
            {page} / {data.pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= data.pagination.pages}
            onClick={() => {
              setPage((p) => p + 1)
            }}
            className="rounded bg-gray-700 px-2 py-1 text-sm text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
