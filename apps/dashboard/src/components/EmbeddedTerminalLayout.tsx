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
        <div className="h-full bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
            <span className="text-sm font-medium text-zinc-300">Sessions</span>
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-zinc-500 hover:text-zinc-300"
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
                className={`w-full text-left px-3 py-2 text-sm border-b border-zinc-800 transition-colors ${
                  activeSessionId === session.id
                    ? 'bg-purple-600/20 text-purple-300'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs font-mono">
                    {session.tool}
                  </span>
                  <span className="truncate">{session.name ?? session.id}</span>
                </div>
              </button>
            ))}
            {sessions.length === 0 && (
              <p className="px-3 py-4 text-zinc-500 text-sm">No sessions</p>
            )}
          </div>
        </div>
      </Panel>
      <Separator className="w-1 bg-zinc-800 hover:bg-purple-600 transition-colors" />
      <Panel defaultSize={75} minSize={30}>
        <div className="h-full">
          {activeSessionId ? (
            <TerminalView sessionId={activeSessionId} />
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-500">
              Select a session from the sidebar
            </div>
          )}
        </div>
      </Panel>
    </Group>
  )
}
