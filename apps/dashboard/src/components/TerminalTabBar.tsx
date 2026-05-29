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

interface TerminalTab {
  id: string
  name: string
  tool: string
}

interface TerminalTabBarProps {
  tabs: TerminalTab[]
  activeId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  onAdd: () => void
}

function getToolColor(tool: string): string {
  switch (tool) {
    case 'OPENCODE':
      return 'var(--color-tool-opencode)'
    case 'CLAUDE':
      return 'var(--color-tool-claude)'
    case 'BASH':
      return 'var(--color-tool-bash)'
    default:
      return 'var(--color-text-dim)'
  }
}

export function TerminalTabBar({ tabs, activeId, onSelect, onClose, onAdd }: TerminalTabBarProps) {
  return (
    <div className="h-12 flex-shrink-0 bg-[var(--color-surface)] border-b border-[var(--color-border)] flex items-stretch overflow-hidden">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          role="tab"
          aria-selected={activeId === tab.id}
          tabIndex={activeId === tab.id ? 0 : -1}
          className="flex items-center gap-1.5 px-4 cursor-pointer relative transition-colors flex-shrink-0 outline-none"
          style={{
            color: activeId === tab.id ? 'var(--color-text)' : 'var(--color-text-dim)',
            background: activeId === tab.id ? 'var(--color-surface-2)' : 'transparent',
          }}
          onClick={() => {
            onSelect(tab.id)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onSelect(tab.id)
            }
          }}
          onMouseEnter={(e) => {
            if (activeId !== tab.id) {
              e.currentTarget.style.background = 'var(--color-selection-hover)'
            }
          }}
          onMouseLeave={(e) => {
            if (activeId !== tab.id) {
              e.currentTarget.style.background = 'transparent'
            }
          }}
        >
          {/* Active indicator */}
          {activeId === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[var(--color-accent)] rounded-t" />
          )}

          {/* Tool dot */}
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: getToolColor(tab.tool) }}
          />

          {/* Tab name */}
          <span className="text-xs font-mono whitespace-nowrap">{tab.name}</span>

          {/* Close button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onClose(tab.id)
            }}
            className="w-4 h-4 flex items-center justify-center rounded-full opacity-0 transition-opacity hover:bg-[var(--color-surface-3)]"
            style={{ color: 'var(--color-text-muted)' }}
            aria-label="Close tab"
          >
            <svg
              width="10"
              height="10"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      ))}

      {/* Add tab button */}
      <button
        type="button"
        onClick={onAdd}
        className="w-10 flex items-center justify-center flex-shrink-0 text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-selection-hover)] transition-colors"
        title="New session"
        aria-label="New session"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M8 3v10M3 8h10" />
        </svg>
      </button>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1 px-2">
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-selection-hover)] transition-colors"
          title="Share session"
          aria-label="Share session"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M11 3.5a1.5 1.5 0 110 .01M4.5 8a1.5 1.5 0 110 .01M11 12.5a1.5 1.5 0 110 .01M5.9 7.1l4.2-2.6M5.9 9l4.2 2.6" />
          </svg>
        </button>
        <button
          type="button"
          className="w-8 h-8 flex items-center justify-center rounded text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-selection-hover)] transition-colors"
          title="Record session"
          aria-label="Record session"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="8" cy="8" r="5.5" />
            <circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" />
          </svg>
        </button>
      </div>
    </div>
  )
}
