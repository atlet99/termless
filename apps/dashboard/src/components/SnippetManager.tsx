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
import { api } from '../lib/api'

interface Snippet {
  id: string
  name: string
  command: string
  tags: string[]
  createdAt: string
}

export function SnippetManager() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [tags, setTags] = useState('')

  const { data: snippets, isLoading } = useQuery<Snippet[]>({
    queryKey: ['snippets'],
    queryFn: () => api.get('/api/v1/snippets'),
  })

  const createSnippet = useMutation({
    mutationFn: (data: { name: string; command: string; tags: string[] }) =>
      api.post('/api/v1/snippets', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['snippets'] })
      setName('')
      setCommand('')
      setTags('')
    },
  })

  const deleteSnippet = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/snippets/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['snippets'] })
    },
  })

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold text-white">Snippets</h2>

      <div className="flex flex-col gap-2">
        <input
          placeholder="Name (e.g. Restart API)"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
          }}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <input
          placeholder="Command (e.g. docker compose restart api)"
          value={command}
          onChange={(e) => {
            setCommand(e.target.value)
          }}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white font-mono"
        />
        <input
          placeholder="Tags (comma-separated, e.g. docker, dev)"
          value={tags}
          onChange={(e) => {
            setTags(e.target.value)
          }}
          className="rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <button
          type="button"
          disabled={!name.trim() || !command.trim() || createSnippet.isPending}
          onClick={() => {
            createSnippet.mutate({
              name: name.trim(),
              command: command.trim(),
              tags: tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }}
          className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500 disabled:opacity-50"
        >
          Add Snippet
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Use Ctrl+Shift+P in terminal to quickly insert snippets
      </p>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-2">
          {snippets?.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="text-sm text-zinc-100">{s.name}</div>
                <div className="text-xs text-zinc-500 font-mono mt-1">{s.command}</div>
                {s.tags.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  deleteSnippet.mutate(s.id)
                }}
                className="text-xs text-zinc-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
          {(!snippets || snippets.length === 0) && (
            <p className="text-zinc-500 text-sm">No snippets yet</p>
          )}
        </div>
      )}
    </div>
  )
}
