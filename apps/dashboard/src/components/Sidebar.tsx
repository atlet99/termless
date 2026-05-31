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

export type NavItem =
  | 'terminal'
  | 'sessions'
  | 'workspaces'
  | 'templates'
  | 'recordings'
  | 'env-vars'
  | 'snippets'
  | 'processes'
  | 'logs'
  | 'admin'
  | 'settings'

interface SidebarProps {
  active: NavItem
  onNav: (item: NavItem) => void
  collapsed: boolean
  onToggle: () => void
  onNewSession: (tool: string) => void
  isAdmin: boolean
}

const NAV_ITEMS: { id: NavItem; labelKey: string; icon: string }[] = [
  { id: 'terminal', labelKey: 'sidebar.terminal', icon: 'terminal' },
  { id: 'sessions', labelKey: 'sidebar.sessions', icon: 'sessions' },
  { id: 'workspaces', labelKey: 'sidebar.workspaces', icon: 'files' },
  { id: 'templates', labelKey: 'sidebar.templates', icon: 'snippets' },
  { id: 'recordings', labelKey: 'sidebar.recordings', icon: 'rec' },
  { id: 'env-vars', labelKey: 'sidebar.envVars', icon: 'settings' },
  { id: 'snippets', labelKey: 'sidebar.snippets', icon: 'snippets' },
  { id: 'processes', labelKey: 'sidebar.processes', icon: 'processes' },
  { id: 'logs', labelKey: 'sidebar.logs', icon: 'logs' },
]

const TOOLS = [
  { id: 'OPENCODE', label: 'opencode', color: 'var(--color-tool-opencode)' },
  { id: 'CLAUDE', label: 'claude', color: 'var(--color-tool-claude)' },
  { id: 'BASH', label: 'bash', color: 'var(--color-tool-bash)' },
]

function NavIcon({ icon, size = 20 }: { icon: string; size?: number }) {
  const p = {
    stroke: 'currentColor',
    strokeWidth: '1.35',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    'aria-hidden': 'true' as const,
  }

  switch (icon) {
    case 'terminal':
      return (
        <svg {...p}>
          <rect x="1" y="2" width="14" height="12" rx="1" />
          <path d="M4 6l3 2.5L4 11M9 11h3" />
        </svg>
      )
    case 'sessions':
      return (
        <svg {...p}>
          <rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1" />
          <rect x="9" y="1.5" width="5.5" height="5.5" rx="1" />
          <rect x="1.5" y="9" width="5.5" height="5.5" rx="1" />
          <rect x="9" y="9" width="5.5" height="5.5" rx="1" />
        </svg>
      )
    case 'files':
      return (
        <svg {...p}>
          <path d="M2 3a1 1 0 011-1h4l2 2h4a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V3z" />
        </svg>
      )
    case 'snippets':
      return (
        <svg {...p}>
          <path d="M4 4L1 8l3 4M12 4l3 4-3 4M10 2L6 14" />
        </svg>
      )
    case 'processes':
      return (
        <svg {...p}>
          <rect x="2" y="2" width="12" height="12" rx="1" />
          <path d="M5 5h6M5 8h6M5 11h3" />
        </svg>
      )
    case 'logs':
      return (
        <svg {...p}>
          <path d="M2 4.5h12M2 8h9M2 11.5h6" />
        </svg>
      )
    case 'rec':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="5.5" />
          <circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="2.3" />
          <path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.3 3.3l1.3 1.3M11.4 11.4l1.3 1.3M3.3 12.7l1.3-1.3M11.4 4.6l1.3-1.3" />
        </svg>
      )
    default:
      return null
  }
}

export function Sidebar({
  active,
  onNav,
  collapsed,
  onToggle,
  onNewSession,
  isAdmin,
}: SidebarProps) {
  const { t } = useTranslation()

  const allItems = isAdmin
    ? [...NAV_ITEMS, { id: 'admin' as NavItem, labelKey: 'sidebar.admin', icon: 'settings' }]
    : NAV_ITEMS

  if (collapsed) {
    return (
      <nav
        className="bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col items-center overflow-hidden flex-shrink-0 transition-all duration-300"
        style={{ width: 80 }}
      >
        <button
          type="button"
          onClick={onToggle}
          className="mt-2 mb-1 w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-selection-hover)] transition-colors"
          title="Expand sidebar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 4l4 4-4 4" />
          </svg>
        </button>

        {/* New session button */}
        <div className="py-1">
          <button
            type="button"
            onClick={() => {
              onNewSession('OPENCODE')
            }}
            title="New session"
            className="w-14 h-14 rounded-2xl flex items-center justify-center cursor-pointer transition-all border-none"
            style={{
              background: 'var(--color-accent-hover)',
              color: 'var(--color-accent)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--color-accent)'
              e.currentTarget.style.color = 'var(--color-text-inverse)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--color-accent-hover)'
              e.currentTarget.style.color = 'var(--color-accent)'
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
          </button>
        </div>

        <span className="w-8 h-px bg-[var(--color-border)] mb-1" />

        {/* Nav items */}
        {allItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onNav(item.id)
            }}
            title={t(item.labelKey)}
            className={`w-20 h-14 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors relative ${
              active === item.id
                ? 'text-[var(--color-accent)]'
                : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
            }`}
          >
            {active === item.id && (
              <span className="absolute w-14 h-8 rounded-full bg-[var(--color-accent-hover)]" />
            )}
            <span className="relative z-10">
              <NavIcon icon={item.icon} />
            </span>
            <span className="relative z-10 text-[10px] font-medium">
              {t(item.labelKey).split(' ')[0]}
            </span>
          </button>
        ))}

        <span className="flex-1" />

        {/* Settings at bottom */}
        <button
          type="button"
          onClick={() => {
            onNav('settings')
          }}
          title={t('sidebar.settings')}
          className={`w-20 h-14 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors mb-2 ${
            active === 'settings'
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)]'
          }`}
        >
          <NavIcon icon="settings" />
          <span className="text-[10px] font-medium">{t('sidebar.settings').split(' ')[0]}</span>
        </button>
      </nav>
    )
  }

  return (
    <nav
      className="bg-[var(--color-surface)] border-r border-[var(--color-border)] flex flex-col overflow-hidden flex-shrink-0 transition-all duration-300"
      style={{ width: 240 }}
    >
      {/* Header */}
      <div className="h-16 flex items-center px-5 flex-shrink-0">
        <span className="flex-1 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
          {t('sidebar.navigation')}
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] transition-colors"
          title="Collapse sidebar"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 4L6 8l4 4" />
          </svg>
        </button>
      </div>

      {/* New session button */}
      <div className="px-4 pb-3">
        <button
          type="button"
          onClick={() => {
            onNewSession('OPENCODE')
          }}
          className="w-full h-12 rounded-[14px] flex items-center justify-center gap-2 text-[13px] font-bold cursor-pointer transition-all border-none"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
            boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M8 3v10M3 8h10" />
          </svg>
          {t('sidebar.newSession')}
        </button>
      </div>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto pb-2">
        {allItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              onNav(item.id)
            }}
            className={`w-full h-[52px] flex items-center gap-3 px-4 cursor-pointer transition-colors rounded-full mx-3 ${
              active === item.id
                ? 'text-[var(--color-accent)] bg-[var(--color-accent-hover)]'
                : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-selection-hover)]'
            }`}
            style={{ width: 'calc(100% - 24px)' }}
          >
            <NavIcon icon={item.icon} />
            <span className="text-sm font-medium truncate">{t(item.labelKey)}</span>
          </button>
        ))}
      </div>

      <span className="h-px bg-[var(--color-border)] mx-4" />

      {/* Quick Launch */}
      <div className="px-3 py-2 flex-shrink-0">
        <div className="text-[10px] text-[var(--color-text-muted)] px-4 py-1 uppercase tracking-widest mb-1">
          {t('sidebar.quickLaunch')}
        </div>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => {
              onNewSession(tool.id)
            }}
            className="w-full h-11 flex items-center gap-3 px-4 cursor-pointer transition-colors rounded-full"
            style={{ color: tool.color }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: tool.color }}
            />
            <span className="text-xs font-mono font-medium">+ {tool.label}</span>
          </button>
        ))}
      </div>

      <span className="h-px bg-[var(--color-border)] mx-4" />

      {/* Settings */}
      <div className="px-3 py-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => {
            onNav('settings')
          }}
          className={`w-full h-[52px] flex items-center gap-3 px-4 cursor-pointer transition-colors rounded-full ${
            active === 'settings'
              ? 'text-[var(--color-accent)] bg-[var(--color-accent-hover)]'
              : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-selection-hover)]'
          }`}
          style={{ width: 'calc(100% - 24px)' }}
        >
          <NavIcon icon="settings" />
          <span className="text-sm font-medium">{t('sidebar.settings')}</span>
        </button>
      </div>
    </nav>
  )
}
