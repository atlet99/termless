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

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import { CURSOR_STYLES, TERMINAL_FONTS, TERMINAL_THEMES } from '../lib/terminal-themes'

interface SettingsPanelProps {
  preferences: {
    terminalTheme: string
    terminalFont: string
    terminalSize: number
    cursorStyle: string
    layoutMode: string
  }
  onClose: () => void
}

export function SettingsPanel({ preferences, onClose }: SettingsPanelProps) {
  const queryClient = useQueryClient()

  const updatePreferences = useMutation({
    mutationFn: (prefs: Record<string, string | number>) => api.updatePreferences(prefs),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-zinc-100">Settings</h2>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-zinc-100">
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="theme" className="block text-sm text-zinc-400 mb-1">
              Theme
            </label>
            <select
              id="theme"
              value={preferences.terminalTheme}
              onChange={(e) => {
                updatePreferences.mutate({ terminalTheme: e.target.value })
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100"
            >
              {Object.keys(TERMINAL_THEMES).map((themeName) => (
                <option key={themeName} value={themeName}>
                  {themeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="font" className="block text-sm text-zinc-400 mb-1">
              Font
            </label>
            <select
              id="font"
              value={preferences.terminalFont}
              onChange={(e) => {
                updatePreferences.mutate({ terminalFont: e.target.value })
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100"
            >
              {TERMINAL_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="fontSize" className="block text-sm text-zinc-400 mb-1">
              Font Size: {preferences.terminalSize}px
            </label>
            <input
              id="fontSize"
              type="range"
              min={12}
              max={20}
              value={preferences.terminalSize}
              onChange={(e) => {
                updatePreferences.mutate({ terminalSize: Number(e.target.value) })
              }}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="cursor" className="block text-sm text-zinc-400 mb-1">
              Cursor Style
            </label>
            <select
              id="cursor"
              value={preferences.cursorStyle}
              onChange={(e) => {
                updatePreferences.mutate({ cursorStyle: e.target.value })
              }}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-100"
            >
              {CURSOR_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}
