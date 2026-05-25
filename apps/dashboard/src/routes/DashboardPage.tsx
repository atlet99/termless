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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { EmbeddedTerminalLayout } from '../components/EmbeddedTerminalLayout'
import { SettingsPanel } from '../components/SettingsPanel'
import { TerminalView } from '../components/Terminal'
import { api } from '../lib/api'
import { useAuthStore } from '../stores/auth'

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)

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

  const updatePreferences = useMutation({
    mutationFn: (prefs: Record<string, string>) => api.updatePreferences(prefs),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['preferences'] }),
  })

  const createSession = useMutation({
    mutationFn: (tool: string) => api.createSession(tool),
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
        <div className="flex gap-4 mb-8">
          {(['OPENCODE', 'CLAUDE', 'BASH'] as const).map((tool) => (
            <button
              key={tool}
              type="button"
              onClick={() => {
                createSession.mutate(tool)
              }}
              disabled={createSession.isPending}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100 hover:bg-zinc-700 transition-colors"
            >
              {t(`session.new${tool.charAt(0) + tool.slice(1).toLowerCase()}`)}
            </button>
          ))}
        </div>

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
      </main>
    </div>
  )
}
