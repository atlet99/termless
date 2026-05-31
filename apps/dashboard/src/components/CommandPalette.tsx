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

import { useCallback, useMemo, useState } from 'react'
import type { NavItem } from './Sidebar'

interface Snippet {
  id: string
  name: string
  command: string
  tags: string[]
}

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: string
  group: string
  action: () => void
}

interface CommandPaletteProps {
  snippets: Snippet[]
  onNavigate: (page: NavItem) => void
  onNewSession: (tool: string) => void
  onSelectSnippet: (command: string) => void
  onClose: () => void
}

function CommandIcon({ icon }: { icon: string }) {
  const p = {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.35',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
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
    case 'logs':
      return (
        <svg {...p}>
          <path d="M2 4.5h12M2 8h9M2 11.5h6" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="2.3" />
          <path d="M8 1.5v1.8M8 12.7v1.8M1.5 8h1.8M12.7 8h1.8M3.3 3.3l1.3 1.3M11.4 11.4l1.3 1.3M3.3 12.7l1.3-1.3M11.4 4.6l1.3-1.3" />
        </svg>
      )
    case 'opencode':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M6 8l1.5 1.5L10 6" />
        </svg>
      )
    case 'claude':
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="5.5" />
          <path d="M6 6.5h4M6 9.5h2.5" />
        </svg>
      )
    case 'bash':
      return (
        <svg {...p}>
          <rect x="2" y="2" width="12" height="12" rx="1" />
          <path d="M5 6l2.5 2L5 10M9 10h3" />
        </svg>
      )
    case 'snippet':
      return (
        <svg {...p}>
          <path d="M4 4L1 8l3 4M12 4l3 4-3 4" />
        </svg>
      )
    default:
      return (
        <svg {...p}>
          <circle cx="8" cy="8" r="5.5" />
        </svg>
      )
  }
}

export function CommandPalette({
  snippets,
  onNavigate,
  onNewSession,
  onSelectSnippet,
  onClose,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)

  const allItems = useMemo((): CommandItem[] => {
    const navigationItems: CommandItem[] = [
      {
        id: 'nav-terminal',
        label: 'Terminal',
        description: 'Go to terminal',
        icon: 'terminal',
        group: 'Navigate',
        action: () => {
          onNavigate('terminal')
        },
      },
      {
        id: 'nav-sessions',
        label: 'Sessions',
        description: 'Manage sessions',
        icon: 'sessions',
        group: 'Navigate',
        action: () => {
          onNavigate('sessions')
        },
      },
      {
        id: 'nav-workspaces',
        label: 'Workspaces',
        description: 'Manage workspaces',
        icon: 'files',
        group: 'Navigate',
        action: () => {
          onNavigate('workspaces')
        },
      },
      {
        id: 'nav-templates',
        label: 'Templates',
        description: 'Session templates',
        icon: 'snippets',
        group: 'Navigate',
        action: () => {
          onNavigate('templates')
        },
      },
      {
        id: 'nav-processes',
        label: 'Processes',
        description: 'View running processes',
        icon: 'sessions',
        group: 'Navigate',
        action: () => {
          onNavigate('processes')
        },
      },
      {
        id: 'nav-snippets',
        label: 'Snippets',
        description: 'Manage snippets',
        icon: 'snippets',
        group: 'Navigate',
        action: () => {
          onNavigate('snippets')
        },
      },
      {
        id: 'nav-logs',
        label: 'Logs',
        description: 'View audit logs',
        icon: 'logs',
        group: 'Navigate',
        action: () => {
          onNavigate('logs')
        },
      },
      {
        id: 'nav-settings',
        label: 'Settings',
        description: 'Terminal settings',
        icon: 'settings',
        group: 'Navigate',
        action: () => {
          onNavigate('settings')
        },
      },
    ]

    const sessionItems: CommandItem[] = [
      {
        id: 'new-opencode',
        label: 'New opencode session',
        description: 'Create a new opencode terminal',
        icon: 'opencode',
        group: 'Sessions',
        action: () => {
          onNewSession('OPENCODE')
        },
      },
      {
        id: 'new-claude',
        label: 'New claude session',
        description: 'Create a new claude code terminal',
        icon: 'claude',
        group: 'Sessions',
        action: () => {
          onNewSession('CLAUDE')
        },
      },
      {
        id: 'new-bash',
        label: 'New bash session',
        description: 'Create a new bash terminal',
        icon: 'bash',
        group: 'Sessions',
        action: () => {
          onNewSession('BASH')
        },
      },
    ]

    const snippetItems: CommandItem[] = snippets.map((s) => ({
      id: `snippet-${s.id}`,
      label: s.name,
      description: s.command,
      icon: 'snippet',
      group: 'Snippets',
      action: () => {
        onSelectSnippet(s.command)
      },
    }))

    return [...navigationItems, ...sessionItems, ...snippetItems]
  }, [snippets, onNavigate, onNewSession, onSelectSnippet])

  const filtered = useMemo(() => {
    if (!query) return allItems
    const q = query.toLowerCase()
    return allItems.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        item.group.toLowerCase().includes(q),
    )
  }, [allItems, query])

  // Group items
  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>()
    for (const item of filtered) {
      const existing = map.get(item.group) ?? []
      existing.push(item)
      map.set(item.group, existing)
    }
    return map
  }, [filtered])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'Escape': {
          onClose()
          break
        }
        case 'ArrowDown': {
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        }
        case 'Enter': {
          if (filtered.length > 0) {
            const selected = filtered[selectedIndex]
            if (selected) {
              selected.action()
              onClose()
            }
          }
          break
        }
      }
    },
    [filtered, selectedIndex, onClose],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]"
      style={{ background: 'var(--color-overlay)', backdropFilter: 'blur(4px)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div
        className="w-full max-w-lg rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Input */}
        <div className="p-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search commands, snippets, navigate..."
            className="w-full bg-transparent outline-none text-sm"
            style={{ color: 'var(--color-text)' }}
            aria-label="Search commands"
            ref={(input) => {
              if (input) input.focus()
            }}
          />
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {[...groups.entries()].map(([group, items]) => (
            <div key={group}>
              {/* Group header */}
              <div
                className="px-4 py-1.5 text-[10px] uppercase tracking-widest font-medium"
                style={{
                  color: 'var(--color-text-dim)',
                  background: 'var(--color-surface-2)',
                  borderBottom: '1px solid var(--color-border-muted)',
                }}
              >
                {group}
              </div>

              {/* Items */}
              {items.map((item) => {
                const globalIndex = filtered.indexOf(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={globalIndex === selectedIndex}
                    onClick={() => {
                      item.action()
                      onClose()
                    }}
                    onMouseEnter={() => {
                      setSelectedIndex(globalIndex)
                    }}
                    className="w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors"
                    style={{
                      background:
                        globalIndex === selectedIndex ? 'var(--color-accent-muted)' : 'transparent',
                      borderBottom: '1px solid var(--color-border-muted)',
                    }}
                  >
                    <span style={{ color: 'var(--color-text-dim)' }}>
                      <CommandIcon icon={item.icon} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="text-sm" style={{ color: 'var(--color-text)' }}>
                        {item.label}
                      </span>
                      {item.description && (
                        <span
                          className="block text-xs truncate mt-0.5"
                          style={{ color: 'var(--color-text-dim)' }}
                        >
                          {item.description}
                        </span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}

          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm" style={{ color: 'var(--color-text-dim)' }}>
              No results found
            </p>
          )}
        </div>

        {/* Footer hint */}
        <div
          className="px-4 py-2 flex items-center gap-4 text-[10px]"
          style={{
            color: 'var(--color-text-muted)',
            borderTop: '1px solid var(--color-border)',
            background: 'var(--color-surface-2)',
          }}
        >
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  )
}
