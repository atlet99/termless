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

interface Workspace {
  id: string
  name: string
  path: string
  createdAt: string
}

const inputStyle = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}

export function WorkspaceManager() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [cloneUrl, setCloneUrl] = useState('')
  const [cloneName, setCloneName] = useState('')
  const [newName, setNewName] = useState('')

  const { data: workspaces, isLoading } = useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: () => api.get('/api/v1/workspaces'),
  })

  const createWorkspace = useMutation({
    mutationFn: (name: string) => api.post('/api/v1/workspaces', { name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setNewName('')
    },
  })

  const cloneWorkspace = useMutation({
    mutationFn: ({ url, name }: { url: string; name: string }) =>
      api.post('/api/v1/workspaces/clone', { url, name }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setCloneUrl('')
      setCloneName('')
    },
  })

  const deleteWorkspace = useMutation({
    mutationFn: (id: string) => api.post(`/api/v1/workspaces/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-6">
        {t('workspaces.title')}
      </h1>

      {/* Create */}
      <div
        className="flex gap-3 mb-3 p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <input
          placeholder={t('workspaces.newName')}
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value)
          }}
          className="flex-1 rounded-md px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
        <button
          type="button"
          disabled={!newName.trim() || createWorkspace.isPending}
          onClick={() => {
            createWorkspace.mutate(newName.trim())
          }}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
          }}
        >
          {t('workspaces.create')}
        </button>
      </div>

      {/* Clone */}
      <div
        className="flex gap-3 mb-6 p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <input
          placeholder={t('workspaces.gitUrl')}
          value={cloneUrl}
          onChange={(e) => {
            setCloneUrl(e.target.value)
          }}
          className="flex-1 rounded-md px-3 py-2 text-sm outline-none font-mono"
          style={inputStyle}
        />
        <input
          placeholder={t('workspaces.name')}
          value={cloneName}
          onChange={(e) => {
            setCloneName(e.target.value)
          }}
          className="w-32 rounded-md px-3 py-2 text-sm outline-none"
          style={inputStyle}
        />
        <button
          type="button"
          disabled={!cloneUrl.trim() || !cloneName.trim() || cloneWorkspace.isPending}
          onClick={() => {
            cloneWorkspace.mutate({ url: cloneUrl.trim(), name: cloneName.trim() })
          }}
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'var(--color-cyan)',
            color: 'var(--color-text-inverse)',
          }}
        >
          {t('workspaces.clone')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-[var(--color-text-dim)] text-sm">{t('common.loading')}</p>
      ) : (
        <div className="space-y-2">
          {workspaces?.map((ws) => (
            <div
              key={ws.id}
              className="flex items-center justify-between p-4 rounded-xl transition-colors hover:border-[var(--color-accent)]"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <div className="text-sm text-[var(--color-text)]">{ws.name}</div>
                <div className="text-xs text-[var(--color-text-dim)] font-mono mt-1">{ws.path}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  deleteWorkspace.mutate(ws.id)
                }}
                className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
          {(!workspaces || workspaces.length === 0) && (
            <p className="text-[var(--color-text-dim)] text-sm">{t('workspaces.empty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
