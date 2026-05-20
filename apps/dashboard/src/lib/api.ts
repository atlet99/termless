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
