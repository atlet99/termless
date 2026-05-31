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

import { Group, Panel, Separator } from 'react-resizable-panels'
import { TerminalView } from './Terminal'

interface EmbeddedTerminalLayoutProps {
  sessions: { id: string; tool: string; name?: string | null }[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onClose: () => void
}

export function EmbeddedTerminalLayout({
  sessions,
  activeSessionId,
  onSelectSession,
  onClose,
}: EmbeddedTerminalLayoutProps) {
  return (
    <Group orientation="horizontal" className="h-full">
      <Panel defaultSize={25} minSize={15} maxSize={40}>
        <div
          className="h-full flex flex-col"
          style={{
            background: 'var(--color-surface)',
            borderRight: '1px solid var(--color-border)',
          }}
        >
          <div
            className="p-3 flex items-center justify-between"
            style={{ borderBottom: '1px solid var(--color-border)' }}
          >
            <span className="text-sm font-medium text-[var(--color-text)]">Sessions</span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            >
              Back
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {sessions.map((session) => (
              <button
                key={session.id}
                type="button"
                onClick={() => {
                  onSelectSession(session.id)
                }}
                className="w-full text-left px-3 py-2 text-sm transition-colors"
                style={{
                  background:
                    activeSessionId === session.id ? 'var(--color-accent-muted)' : 'transparent',
                  color:
                    activeSessionId === session.id
                      ? 'var(--color-accent)'
                      : 'var(--color-text-dim)',
                  borderBottom: '1px solid var(--color-border-muted)',
                }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="px-1.5 py-0.5 rounded text-xs font-mono"
                    style={{
                      background: 'var(--color-surface-3)',
                      color: 'var(--color-text-dim)',
                    }}
                  >
                    {session.tool}
                  </span>
                  <span className="truncate">{session.name ?? session.id}</span>
                </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="px-3 py-4 text-[var(--color-text-dim)] text-sm">No sessions</p>
            )}
          </div>
        </div>
      </Panel>
      <Separator className="w-1 bg-[var(--color-border)] hover:bg-[var(--color-accent)] transition-colors" />
      <Panel defaultSize={75} minSize={30}>
        <div className="h-full">
          {activeSessionId ? (
            <TerminalView sessionId={activeSessionId} />
          ) : (
            <div className="h-full flex items-center justify-center text-[var(--color-text-dim)]">
              Select a session from the sidebar
            </div>
          )}
        </div>
      </Panel>
    </Group>
  )
}
