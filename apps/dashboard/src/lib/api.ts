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

export interface User {
  id: string
  email: string
  displayName: string | null
  role: string
  createdAt: string
}

export interface Session {
  id: string
  userId: string
  name: string | null
  notes: string | null
  tool: string
  tmuxSession: string
  ttydPort: number | null
  lastSeenAt: string | null
  createdAt: string
}

export interface Workspace {
  id: string
  userId: string
  name: string
  path: string
  createdAt: string
}

export interface Snippet {
  id: string
  userId: string
  name: string
  command: string
  tags: string[]
  createdAt: string
}

export interface Preferences {
  terminalTheme: string
  terminalFont: string
  terminalSize: number
  cursorStyle: string
  layoutMode: string
}

export interface LoginResponse {
  token: string
  user: User
}

export interface CreateSessionResponse {
  id: string
  wsUrl: string
}

export interface ShareResponse {
  shareToken: string
  url: string
}

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
  get: <T>(path: string) => fetchApi<T>(path),

  post: <T>(path: string, body?: unknown) =>
    fetchApi<T>(path, {
      method: 'POST',
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),

  put: <T>(path: string, body?: unknown) =>
    fetchApi<T>(path, {
      method: 'PUT',
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),

  patch: <T>(path: string, body?: unknown) =>
    fetchApi<T>(path, {
      method: 'PATCH',
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),

  delete: <T>(path: string) => fetchApi<T>(path, { method: 'DELETE' }),

  login: (email: string, password: string) =>
    fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => fetchApi<{ user: User }>('/auth/me'),

  getSessions: () => fetchApi<Session[]>('/api/v1/sessions'),

  createSession: (tool: string, templateId?: string) =>
    fetchApi<CreateSessionResponse>('/api/v1/sessions', {
      method: 'POST',
      body: JSON.stringify({ tool, templateId }),
    }),

  deleteSession: (id: string) => fetchApi<void>(`/api/v1/sessions/${id}`, { method: 'DELETE' }),

  getWorkspaces: () => fetchApi<Workspace[]>('/api/v1/workspaces'),

  createWorkspace: (name: string) =>
    fetchApi<Workspace>('/api/v1/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getPreferences: () => fetchApi<Preferences>('/api/v1/me/preferences'),

  updatePreferences: (prefs: Partial<Preferences>) =>
    fetchApi<Preferences>('/api/v1/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(prefs),
    }),

  getSnippets: () => fetchApi<Snippet[]>('/api/v1/snippets'),

  createSnippet: (data: { name: string; command: string; tags?: string[] }) =>
    fetchApi<Snippet>('/api/v1/snippets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteSnippet: (id: string) => fetchApi<void>(`/api/v1/snippets/${id}`, { method: 'DELETE' }),

  createShare: (sessionId: string, expiresIn: string) =>
    fetchApi<ShareResponse>(`/api/v1/sessions/${sessionId}/share`, {
      method: 'POST',
      body: JSON.stringify({ expiresIn }),
    }),

  revokeShare: (sessionId: string, token: string) =>
    fetchApi<void>(`/api/v1/sessions/${sessionId}/share?token=${token}`, { method: 'DELETE' }),
}
