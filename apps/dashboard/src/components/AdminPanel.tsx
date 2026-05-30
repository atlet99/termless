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

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

interface User {
  id: string
  email: string
  displayName: string | null
  role: string
  createdAt: string
}

const ROLES = ['VIEWER', 'DEVELOPER', 'OPERATOR', 'ADMIN'] as const

const selectStyle = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}

export function AdminPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/api/v1/admin/users'),
  })

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.post(`/api/v1/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  const forceLogout = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/api/v1/admin/users/${userId}/sessions`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
  })

  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-6">{t('admin.title')}</h1>

      {isLoading ? (
        <p className="text-[var(--color-text-dim)] text-sm">{t('common.loading')}</p>
      ) : (
        <div className="space-y-2">
          {users?.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-4 rounded-xl transition-colors hover:border-[var(--color-accent)]"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex-1">
                <div className="text-sm text-[var(--color-text)]">{u.displayName ?? u.email}</div>
                <div className="text-xs text-[var(--color-text-dim)]">{u.email}</div>
                <div className="text-xs text-[var(--color-text-muted)] font-mono mt-1">
                  {u.id} · {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => {
                    updateRole.mutate({ userId: u.id, role: e.target.value })
                  }}
                  className="rounded-md px-2 py-1 text-xs"
                  style={selectStyle}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    forceLogout.mutate(u.id)
                  }}
                  className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
                >
                  Force Logout
                </button>
              </div>
            </div>
          ))}
          {(!users || users.length === 0) && (
            <p className="text-[var(--color-text-dim)] text-sm">No users</p>
          )}
        </div>
      )}
    </div>
  )
}
