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

import { useCallback, useRef, useState } from 'react'

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
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = snippets.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      s.command.toLowerCase().includes(query.toLowerCase()) ||
      s.tags.some((t) => t.toLowerCase().includes(query.toLowerCase())),
  )

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
            if (selected) onSelect(selected.command)
          }
          break
        }
      }
    },
    [filtered, selectedIndex, onSelect, onClose],
  )

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden">
        <div className="p-3 border-b border-zinc-800">
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search snippets..."
            className="w-full bg-transparent text-zinc-100 outline-none placeholder:text-zinc-500"
            aria-label="Search snippets"
            aria-controls="snippet-list"
            aria-activedescendant={
              filtered[selectedIndex] ? `snippet-${filtered[selectedIndex].id}` : undefined
            }
            ref={(input) => {
              if (input) input.focus()
            }}
          />
        </div>
        <div
          id="snippet-list"
          ref={listRef}
          className="max-h-64 overflow-y-auto"
          role="listbox"
          aria-label="Available snippets"
        >
          {filtered.map((snippet, index) => (
            <button
              key={snippet.id}
              id={`snippet-${snippet.id}`}
              type="button"
              role="option"
              aria-selected={index === selectedIndex}
              onClick={() => {
                onSelect(snippet.command)
              }}
              className={`w-full text-left px-4 py-3 transition-colors border-b border-zinc-800 last:border-0 ${
                index === selectedIndex ? 'bg-zinc-800' : 'hover:bg-zinc-800'
              }`}
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
