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
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

interface Snippet {
  id: string
  name: string
  command: string
  tags: string[]
  createdAt: string
}

const inputStyle = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}

export function SnippetManager() {
  const { t } = useTranslation()
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
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-6">{t('snippets.title')}</h1>

      {/* Create form */}
      <div
        className="flex flex-col gap-3 mb-6 p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <input
          placeholder={t('snippets.name')}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
          }}
          className="rounded-md px-3 py-2 text-sm outline-none font-mono"
          style={inputStyle}
        />
        <input
          placeholder={t('snippets.command')}
          value={command}
          onChange={(e) => {
            setCommand(e.target.value)
          }}
          className="rounded-md px-3 py-2 text-sm outline-none font-mono"
          style={inputStyle}
        />
        <input
          placeholder={t('snippets.tags')}
          value={tags}
          onChange={(e) => {
            setTags(e.target.value)
          }}
          className="rounded-md px-3 py-2 text-sm outline-none"
          style={inputStyle}
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
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
          }}
        >
          {t('snippets.add')}
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-dim)] mb-4">{t('snippets.hint')}</p>

      {isLoading ? (
        <p className="text-[var(--color-text-dim)] text-sm">{t('common.loading')}</p>
      ) : (
        <div className="space-y-2">
          {snippets?.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-4 rounded-xl transition-colors hover:border-[var(--color-accent)]"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex-1">
                <div className="text-sm text-[var(--color-text)]">{s.name}</div>
                <div className="text-xs text-[var(--color-accent)] font-mono mt-1">{s.command}</div>
                {s.tags.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {s.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded text-xs"
                        style={{
                          background: 'var(--color-surface-3)',
                          color: 'var(--color-text-dim)',
                        }}
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
                className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
          {(!snippets || snippets.length === 0) && (
            <p className="text-[var(--color-text-dim)] text-sm">{t('snippets.empty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
