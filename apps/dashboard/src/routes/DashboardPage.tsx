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
import { SnippetManager } from '../components/SnippetManager'
import { TerminalView } from '../components/Terminal'
import { WorkspaceManager } from '../components/WorkspaceManager'
import { api } from '../lib/api'
import { useNotifications } from '../lib/notifications'
import { useAuthStore } from '../stores/auth'

type Tab = 'sessions' | 'workspaces' | 'recordings' | 'env-vars' | 'snippets' | 'admin'

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [showPalette, setShowPalette] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('sessions')
  const token = useAuthStore((s) => s.token)
  const { events: notifications } = useNotifications(token)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault()
        setShowPalette((v) => !v)
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('keydown', handler)
    }
  }, [])

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en'
    void i18n.changeLanguage(newLang)
    localStorage.setItem('termless_lang', newLang)
  }

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

  const updatePreferences = useMutation({
    mutationFn: (prefs: Record<string, string>) => api.updatePreferences(prefs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  })

  const createSession = useMutation({
    mutationFn: ({ tool, templateId }: { tool: string; templateId?: string }) =>
      api.post('/api/v1/sessions', { tool, templateId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const deleteSession = useMutation({
    mutationFn: (id: string) => api.deleteSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const layoutMode = preferences?.layoutMode ?? 'popup'

  const toggleLayoutMode = () => {
    const newMode = layoutMode === 'popup' ? 'embedded' : 'popup'
    updatePreferences.mutate({ layoutMode: newMode })
  }

  if (activeSessionId && layoutMode === 'popup') {
    return (
      <div className="h-screen flex flex-col bg-zinc-950">
        <div className="flex items-center gap-4 px-4 py-2 bg-zinc-900 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setActiveSessionId(null)
            }}
            className="text-sm text-zinc-400 hover:text-zinc-100"
          >
            {t('dashboard.back')}
          </button>
          <span className="text-sm text-zinc-400">{activeSessionId}</span>
          <button
            type="button"
            onClick={() => {
              setShowSettings(true)
            }}
            className="ml-auto text-sm text-zinc-500 hover:text-zinc-300"
          >
            Settings
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

  if (layoutMode === 'embedded') {
    return (
      <div className="h-screen flex flex-col bg-zinc-950">
        <header className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-zinc-100">Termless</h1>
            <button
              type="button"
              onClick={toggleLayoutMode}
              className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              Popup
            </button>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleLanguage}
              className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
            >
              {i18n.language === 'en' ? 'RU' : 'EN'}
            </button>
            <span className="text-sm text-zinc-400">{user?.email}</span>
            <button
              type="button"
              onClick={logout}
              className="text-sm text-zinc-500 hover:text-zinc-100"
            >
              {t('dashboard.logout')}
            </button>
          </div>
        </header>
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
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-zinc-100">Termless</h1>
          <button
            type="button"
            onClick={toggleLayoutMode}
            className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            Embedded
          </button>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleLanguage}
            className="text-xs px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-400 hover:text-zinc-100 transition-colors"
          >
            {i18n.language === 'en' ? 'RU' : 'EN'}
          </button>
          <span className="text-sm text-zinc-400">{user?.email}</span>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-zinc-500 hover:text-zinc-100"
          >
            {t('dashboard.logout')}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {notifications.length > 0 && (
          <div className="mb-4 p-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400">
            {notifications.slice(-3).map((n) => (
              <div key={`${n.type}-${n.timestamp}`}>
                {n.type}: {JSON.stringify(n.data)}
              </div>
            ))}
          </div>
        )}

        <div
          className="flex gap-4 mb-6 border-b border-zinc-800 pb-2"
          role="tablist"
          aria-label="Dashboard sections"
        >
          {(
            [
              'sessions',
              'workspaces',
              'recordings',
              'env-vars',
              'snippets',
              ...(user?.role === 'ADMIN' ? ['admin'] : []),
            ] as const
          ).map((tab) => (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={activeTab === tab}
              tabIndex={activeTab === tab ? 0 : -1}
              onClick={() => {
                setActiveTab(tab as Tab)
              }}
              onKeyDown={(e) => {
                const tabs = [
                  'sessions',
                  'workspaces',
                  'recordings',
                  'env-vars',
                  'snippets',
                  ...(user?.role === 'ADMIN' ? ['admin'] : []),
                ]
                const currentIndex = tabs.indexOf(activeTab)
                if (e.key === 'ArrowRight') {
                  const nextIndex = (currentIndex + 1) % tabs.length
                  setActiveTab(tabs[nextIndex] as Tab)
                } else if (e.key === 'ArrowLeft') {
                  const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length
                  setActiveTab(tabs[prevIndex] as Tab)
                }
              }}
              className={`text-sm pb-1 border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'env-vars' ? 'Env Vars' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'workspaces' && <WorkspaceManager />}
        {activeTab === 'recordings' && <RecordingsList />}
        {activeTab === 'env-vars' && <EnvVarsManager />}
        {activeTab === 'snippets' && <SnippetManager />}
        {activeTab === 'admin' && user?.role === 'ADMIN' && <AdminPanel />}
        {activeTab === 'sessions' && (
          <>
            <div className="flex gap-4 mb-4">
              {(['OPENCODE', 'CLAUDE', 'BASH'] as const).map((tool) => (
                <button
                  key={tool}
                  type="button"
                  onClick={() => {
                    createSession.mutate({ tool })
                  }}
                  disabled={createSession.isPending}
                  className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 hover:bg-zinc-700 transition-colors"
                >
                  {t(`session.new${tool.charAt(0) + tool.slice(1).toLowerCase()}`)}
                </button>
              ))}
            </div>

            {templates && (templates as any[]).length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-400 mb-2">From Template</h3>
                <div className="flex flex-wrap gap-2">
                  {(templates as any[]).map((tpl: any) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        createSession.mutate({ tool: tpl.tool, templateId: tpl.id })
                      }}
                      className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
                    >
                      {tpl.name} ({tpl.tool})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <h2 className="text-lg font-semibold text-zinc-200 mb-4">
              {t('dashboard.activeSessions')}
            </h2>
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
                    <span className="text-sm text-zinc-400">{session.name ?? session.id}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSessionId(session.id)
                      }}
                      className="px-3 py-1 text-sm bg-purple-600 hover:bg-purple-700 rounded text-white transition-colors"
                    >
                      {t('dashboard.connect')}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deleteSession.mutate(session.id)
                      }}
                      className="px-3 py-1 text-sm bg-zinc-800 hover:bg-red-600 rounded text-zinc-400 hover:text-white transition-colors"
                    >
                      {t('dashboard.delete')}
                    </button>
                  </div>
                </div>
              ))}
              {(!sessions || sessions.length === 0) && (
                <p className="text-zinc-500 text-sm">{t('dashboard.noSessions')}</p>
              )}
            </div>
          </>
        )}

        {user?.role === 'ADMIN' && (
          <div className="mt-8">
            <a href="#/admin/audit" className="text-sm text-purple-400 hover:text-purple-300">
              View Audit Log
            </a>
          </div>
        )}
      </main>

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
