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

const API_BASE = ''

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('termless_token')
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  login: (email: string, password: string) =>
    fetchApi<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => fetchApi<{ user: any }>('/auth/me'),

  getSessions: () => fetchApi<any[]>('/api/v1/sessions'),

  createSession: (tool: string) =>
    fetchApi<any>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ tool }),
    }),

  deleteSession: (id: string) => fetchApi<void>(`/api/v1/sessions/${id}`, { method: 'DELETE' }),

  getWorkspaces: () => fetchApi<any[]>('/api/v1/workspaces'),

  createWorkspace: (name: string, path: string) =>
    fetchApi<any>('/api/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, path }),
    }),
}
