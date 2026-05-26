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

import { useState } from 'react'

interface Snippet {
  id: string
  name: string
  command: string
  tags: string[]
}

interface CommandPaletteProps {
  snippets: Snippet[]
  onSelect: (command: string) => void
  onClose: () => void
}

export function CommandPalette({ snippets, onSelect, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')

  const filtered = snippets.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.command.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-3 border-b border-zinc-800">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose()
              if (e.key === 'Enter' && filtered.length > 0) {
                const first = filtered[0]
                if (first) onSelect(first.command)
              }
            }}
            placeholder="Search snippets..."
            className="w-full bg-transparent text-zinc-100 outline-none placeholder:text-zinc-500"
            ref={(input) => {
              if (input) input.focus()
            }}
          />
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filtered.map((snippet) => (
            <button
              key={snippet.id}
              type="button"
              onClick={() => {
                onSelect(snippet.command)
              }}
              className="w-full text-left px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0"
            >
              <div className="text-sm text-zinc-100">{snippet.name}</div>
              <div className="text-xs text-zinc-500 font-mono mt-1">{snippet.command}</div>
              {snippet.tags.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {snippet.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-zinc-500 text-sm">No snippets found</p>
          )}
        </div>
      </div>
    </div>
  )
}
