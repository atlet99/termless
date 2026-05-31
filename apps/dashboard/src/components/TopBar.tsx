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

import { useTranslation } from 'react-i18next'
import { StatusBadge } from './StatusBadge'
import { ThemeSwitch } from './ThemeSwitch'

interface TopBarProps {
  connectionStatus: 'connected' | 'degraded' | 'reconnecting' | 'offline'
  onOpenPalette: () => void
  isDark: boolean
  onToggleTheme: () => void
  onLogout: () => void
  userEmail: string | undefined
}

export function TopBar({
  connectionStatus,
  onOpenPalette,
  isDark,
  onToggleTheme,
  onLogout,
  userEmail,
}: TopBarProps) {
  const { i18n } = useTranslation()

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ru' : 'en'
    void i18n.changeLanguage(newLang)
    localStorage.setItem('termless_lang', newLang)
  }

  const initials = userEmail
    ? (userEmail.split('@')[0] ?? userEmail)
        .split('.')
        .map((p) => p[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('')
    : '?'

  return (
    <header className="h-16 flex-shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-center px-4 gap-3 z-10">
      {/* Logo */}
      <span className="text-[17px] font-bold text-[var(--color-accent)] tracking-tight mr-3 font-mono">
        termless
      </span>

      {/* Divider */}
      <span className="w-px h-5 bg-[var(--color-border)]" />

      {/* CmdK button */}
      <button
        type="button"
        onClick={onOpenPalette}
        className="inline-flex items-center gap-2 px-4 h-10 rounded-full border border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors text-sm"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          role="presentation"
        >
          <circle cx="6.5" cy="6.5" r="4.5" />
          <path d="M10 10l3.5 3.5" />
        </svg>
        <span className="text-xs text-[var(--color-text-muted)]">Search</span>
        <kbd className="ml-1 text-[10px] text-[var(--color-text-muted)] border border-[var(--color-border)] rounded px-1.5 py-0.5 font-mono">
          Ctrl+K
        </kbd>
      </button>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Language toggle */}
        <div className="flex border border-[var(--color-border)] rounded-full overflow-hidden flex-shrink-0">
          {(['en', 'ru'] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => {
                if (lang !== i18n.language) toggleLanguage()
              }}
              className="px-2.5 py-1 text-[11px] font-medium font-mono transition-colors border-none cursor-pointer"
              style={{
                background: i18n.language === lang ? 'var(--color-accent-muted)' : 'transparent',
                color: i18n.language === lang ? 'var(--color-accent)' : 'var(--color-text-dim)',
              }}
            >
              {lang.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Status badge */}
        <StatusBadge status={connectionStatus} />

        {/* Divider */}
        <span className="w-px h-5 bg-[var(--color-border)]" />

        {/* Theme switch */}
        <ThemeSwitch isDark={isDark} onToggle={onToggleTheme} />

        {/* Divider */}
        <span className="w-px h-5 bg-[var(--color-border)]" />

        {/* User */}
        <span className="text-xs text-[var(--color-text-dim)]">{userEmail}</span>
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 cursor-pointer border-2"
          style={{
            background: 'var(--color-accent-hover)',
            color: 'var(--color-accent)',
            borderColor: 'var(--color-accent)',
          }}
        >
          {initials}
        </span>
        <button
          type="button"
          onClick={onLogout}
          className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-red)] transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  )
}
