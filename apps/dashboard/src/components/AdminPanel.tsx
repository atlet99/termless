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
import { api } from '../lib/api'

interface User {
  id: string
  email: string
  displayName: string | null
  role: string
  createdAt: string
}

const ROLES = ['VIEWER', 'DEVELOPER', 'OPERATOR', 'ADMIN'] as const

export function AdminPanel() {
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
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold text-white">User Management</h2>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-2">
          {users?.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="text-sm text-zinc-100">{u.displayName ?? u.email}</div>
                <div className="text-xs text-zinc-500">{u.email}</div>
                <div className="text-xs text-zinc-600 font-mono mt-1">
                  {u.id} · {new Date(u.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={u.role}
                  onChange={(e) => {
                    updateRole.mutate({ userId: u.id, role: e.target.value })
                  }}
                  className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-xs text-white"
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
                  className="text-xs text-zinc-500 hover:text-red-400"
                >
                  Force Logout
                </button>
              </div>
            </div>
          ))}
          {(!users || users.length === 0) && <p className="text-zinc-500 text-sm">No users</p>}
        </div>
      )}
    </div>
  )
}
