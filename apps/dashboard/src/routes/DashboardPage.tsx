import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { TerminalView } from '../components/Terminal'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

export function DashboardPage({ onBack }: { onBack: () => void }) {
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
  })

  const createSession = useMutation({
    mutationFn: (tool: string) => api.createSession(tool),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const deleteSession = useMutation({
    mutationFn: (id: string) => api.deleteSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  if (activeSessionId) {
    return (
      <div className="h-screen flex flex-col bg-zinc-950">
        <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <button
            onClick={() => setActiveSessionId(null)}
            className="text-sm text-zinc-400 hover:text-zinc-100"
          >
            ← Back
          </button>
          <span className="text-sm text-zinc-400">{activeSessionId}</span>
        </div>
        <div className="flex-1">
          <TerminalView sessionId={activeSessionId} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-zinc-100">Termless</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user?.email}</span>
          <button onClick={logout} className="text-sm text-zinc-500 hover:text-zinc-100">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex gap-4 mb-8">
          {(['OPENCODE', 'CLAUDE', 'BASH'] as const).map((tool) => (
            <button
              key={tool}
              onClick={() => createSession.mutate(tool)}
              disabled={createSession.isPending}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              + {tool.charAt(0) + tool.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold text-zinc-200 mb-4">Active Sessions</h2>
        <div className="space-y-2">
          {sessions?.map((session: any) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-zinc-800 rounded text-xs font-mono text-purple-400">
                  {session.tool}
                </span>
                <span className="text-sm text-zinc-400">{session.id}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveSessionId(session.id)}
                  className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                >
                  Connect
                </button>
                <button
                  onClick={() => deleteSession.mutate(session.id)}
                  className="px-3 py-1 text-sm bg-zinc-800 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {(!sessions || sessions.length === 0) && (
            <p className="text-zinc-500 text-sm">No active sessions. Create one above.</p>
          )}
        </div>
      </main>
    </div>
  )
}
