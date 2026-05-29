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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdminPanel } from '../components/AdminPanel'
import { CommandPalette } from '../components/CommandPalette'
import { EmbeddedTerminalLayout } from '../components/EmbeddedTerminalLayout'
import { EnvVarsManager } from '../components/EnvVarsManager'
import { RecordingsList } from '../components/RecordingsList'
import { SettingsPanel } from '../components/SettingsPanel'
import { type NavItem, Sidebar } from '../components/Sidebar'
import { SnippetManager } from '../components/SnippetManager'
import { TerminalView } from '../components/Terminal'
import { ToolBadge } from '../components/ToolBadge'
import { TopBar } from '../components/TopBar'
import { WorkspaceManager } from '../components/WorkspaceManager'
import { api } from '../lib/api'
import { useNotifications } from '../lib/notifications'
import { useAuthStore } from '../stores/auth'

export function DashboardPage() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const token = useAuthStore((s) => s.token)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [activeNav, setActiveNav] = useState<NavItem>('sessions')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isDark, setIsDark] = useState(true)
  const { events: notifications, connected } = useNotifications(token)

  const connectionStatus: 'connected' | 'degraded' | 'reconnecting' | 'offline' = connected
    ? 'connected'
    : 'reconnecting'

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setShowPalette((v) => !v)
      }
      if (e.key === 'Escape') {
        setShowPalette(false)
        setShowSettings(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [])

  const { data: sessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => api.getSessions(),
  })

  const { data: preferences } = useQuery({
    queryKey: ['preferences'],
    queryFn: () => api.getPreferences(),
  })

  const { data: snippets } = useQuery({
    queryKey: ['snippets'],
    queryFn: () => api.getSnippets(),
  })

  const { data: templates } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/api/v1/templates'),
  })

  const createSession = useMutation({
    mutationFn: ({ tool, templateId }: { tool: string; templateId?: string }) =>
      api.post('/api/v1/sessions', { tool, templateId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const deleteSession = useMutation({
    mutationFn: (id: string) => api.deleteSession(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })

  const layoutMode = preferences?.layoutMode ?? 'popup'

  const handleNewSession = (tool: string, templateId?: string) => {
    createSession.mutate({ tool, ...(templateId !== undefined && { templateId }) })
    setActiveNav('terminal')
  }

  // Popup terminal mode — full screen terminal
  if (activeSessionId && layoutMode === 'popup') {
    return (
      <div className="h-screen flex flex-col bg-[var(--color-bg)]">
        <div className="flex items-center gap-4 px-4 py-2 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => {
              setActiveSessionId(null)
            }}
            className="text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            {t('dashboard.back')}
          </button>
          <ToolBadge tool={sessions?.find((s: any) => s.id === activeSessionId)?.tool ?? ''} />
          <span className="text-sm text-[var(--color-text-dim)] font-mono">{activeSessionId}</span>
          <button
            type="button"
            onClick={() => {
              setShowSettings(true)
            }}
            className="ml-auto text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            {t('dashboard.settings')}
          </button>
        </div>
        <div className="flex-1">
          <TerminalView
            sessionId={activeSessionId}
            theme={preferences?.terminalTheme ?? 'tokyo-night'}
            fontFamily={preferences?.terminalFont ?? 'JetBrains Mono'}
            fontSize={preferences?.terminalSize ?? 15}
            cursorStyle={preferences?.cursorStyle ?? 'block'}
          />
        </div>
        {showSettings && preferences && (
          <SettingsPanel
            preferences={preferences}
            onClose={() => {
              setShowSettings(false)
            }}
          />
        )}
      </div>
    )
  }

  // Embedded terminal mode — sidebar + terminal split
  if (layoutMode === 'embedded') {
    return (
      <div className="h-screen flex flex-col bg-[var(--color-bg)]">
        <TopBar
          connectionStatus={connectionStatus}
          onOpenPalette={() => {
            setShowPalette(true)
          }}
          isDark={isDark}
          onToggleTheme={() => {
            setIsDark((d) => !d)
          }}
          onLogout={logout}
          userEmail={user?.email}
        />
        <div className="flex-1">
          <EmbeddedTerminalLayout
            sessions={sessions ?? []}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onClose={() => {
              setActiveSessionId(null)
            }}
          />
        </div>
        {showPalette && (
          <CommandPalette
            snippets={snippets ?? []}
            onSelect={(command) => {
              setShowPalette(false)
              if (activeSessionId) {
                void api.post(`/api/v1/sessions/${activeSessionId}/exec`, { command })
              }
            }}
            onClose={() => {
              setShowPalette(false)
            }}
          />
        )}
      </div>
    )
  }

  // Main dashboard layout — sidebar + topbar + content
  return (
    <div className="h-screen flex flex-col bg-[var(--color-bg)]">
      <TopBar
        onLogout={logout}
        connectionStatus={connectionStatus}
        onOpenPalette={() => {
          setShowPalette(true)
        }}
        isDark={isDark}
        onToggleTheme={() => {
          setIsDark((d) => !d)
        }}
        userEmail={user?.email}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          active={activeNav}
          onNav={setActiveNav}
          collapsed={sidebarCollapsed}
          onToggle={() => {
            setSidebarCollapsed((c) => !c)
          }}
          onNewSession={handleNewSession}
          isAdmin={user?.role === 'ADMIN'}
        />

        <main className="flex-1 overflow-y-auto">
          {/* Page content */}
          <div className="p-6">
            {activeNav === 'sessions' && (
              <SessionsView
                sessions={sessions ?? []}
                templates={templates as any[]}
                onCreateSession={(tool, templateId) => {
                  createSession.mutate({
                    tool,
                    ...(templateId !== undefined && { templateId }),
                  })
                }}
                onConnect={(id) => {
                  setActiveSessionId(id)
                }}
                onDelete={(id) => {
                  deleteSession.mutate(id)
                }}
                isPending={createSession.isPending}
              />
            )}

            {activeNav === 'workspaces' && <WorkspaceManager />}
            {activeNav === 'recordings' && <RecordingsList />}
            {activeNav === 'env-vars' && <EnvVarsManager />}
            {activeNav === 'snippets' && <SnippetManager />}
            {activeNav === 'templates' && <TemplatesPlaceholder />}
            {activeNav === 'logs' && <LogsPlaceholder />}
            {activeNav === 'admin' && user?.role === 'ADMIN' && <AdminPanel />}
            {activeNav === 'settings' && preferences && (
              <SettingsPanel
                preferences={preferences}
                onClose={() => {
                  setActiveNav('sessions')
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Notifications bar (temporary — will be replaced with toasts) */}
      {notifications.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
          {notifications.slice(-3).map((n) => (
            <div
              key={`${n.type}-${n.timestamp}`}
              className="px-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-dim)] shadow-lg"
            >
              {n.type}: {JSON.stringify(n.data)}
            </div>
          ))}
        </div>
      )}

      {showPalette && (
        <CommandPalette
          snippets={snippets ?? []}
          onSelect={(command) => {
            setShowPalette(false)
            if (activeSessionId) {
              void api.post(`/api/v1/sessions/${activeSessionId}/exec`, { command })
            }
          }}
          onClose={() => {
            setShowPalette(false)
          }}
        />
      )}
    </div>
  )
}

/* ── Sessions view (inline component) ── */

interface SessionsViewProps {
  sessions: any[]
  templates: any[] | undefined
  onCreateSession: (tool: string, templateId?: string) => void
  onConnect: (id: string) => void
  onDelete: (id: string) => void
  isPending: boolean
}

function SessionsView({
  sessions,
  templates,
  onCreateSession,
  onConnect,
  onDelete,
  isPending,
}: SessionsViewProps) {
  const { t } = useTranslation()

  return (
    <div>
      {/* New session buttons */}
      <div className="flex gap-3 mb-6">
        {(['OPENCODE', 'CLAUDE', 'BASH'] as const).map((tool) => (
          <button
            key={tool}
            type="button"
            onClick={() => {
              onCreateSession(tool)
            }}
            disabled={isPending}
            className="px-4 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg text-[var(--color-text)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-sm"
          >
            {t(`session.new${tool.charAt(0) + tool.slice(1).toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* Templates */}
      {templates && templates.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[var(--color-text-dim)] mb-2">From Template</h3>
          <div className="flex flex-wrap gap-2">
            {templates.map((tpl: any) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => {
                  onCreateSession(tpl.tool, tpl.id)
                }}
                className="px-3 py-1.5 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded text-xs text-[var(--color-text)] hover:border-[var(--color-accent)] transition-colors"
              >
                {tpl.name} ({tpl.tool})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active sessions */}
      <h2 className="text-lg font-semibold text-[var(--color-text)] mb-4">
        {t('dashboard.activeSessions')}
      </h2>
      <div className="space-y-2">
        {sessions.map((session: any) => (
          <div
            key={session.id}
            className="flex items-center justify-between p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl transition-colors hover:border-[var(--color-accent)]"
          >
            <div className="flex items-center gap-4">
              <ToolBadge tool={session.tool} />
              <span className="text-sm text-[var(--color-text)]">{session.name ?? session.id}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onConnect(session.id)
                }}
                className="px-3 py-1 text-sm rounded transition-colors"
                style={{
                  background: 'var(--color-accent)',
                  color: 'var(--color-text-inverse)',
                }}
              >
                {t('dashboard.connect')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(session.id)
                }}
                className="px-3 py-1 text-sm border border-[var(--color-border)] rounded text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
              >
                {t('dashboard.delete')}
              </button>
            </div>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-[var(--color-text-dim)] text-sm">{t('dashboard.noSessions')}</p>
        )}
      </div>
    </div>
  )
}

/* ── Placeholder pages (to be implemented) ── */

function TemplatesPlaceholder() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-4">
        {t('sidebar.templates')}
      </h1>
      <p className="text-[var(--color-text-dim)] text-sm">Templates management coming soon.</p>
    </div>
  )
}

function LogsPlaceholder() {
  const { t } = useTranslation()
  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-4">{t('sidebar.logs')}</h1>
      <p className="text-[var(--color-text-dim)] text-sm">Logs viewer coming soon.</p>
    </div>
  )
}
