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

interface Workspace {
  id: string
  name: string
  path: string
  createdAt: string
}

export function WorkspaceManager() {
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['workspaces'] }),
  })

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold text-white">Workspaces</h2>

      <div className="flex gap-2">
        <input
          placeholder="New workspace name"
          value={newName}
          onChange={(e) => {
            setNewName(e.target.value)
          }}
          className="flex-1 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <button
          type="button"
          disabled={!newName.trim() || createWorkspace.isPending}
          onClick={() => {
            createWorkspace.mutate(newName.trim())
          }}
          className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500 disabled:opacity-50"
        >
          Create
        </button>
      </div>

      <div className="flex gap-2">
        <input
          placeholder="Git URL"
          value={cloneUrl}
          onChange={(e) => {
            setCloneUrl(e.target.value)
          }}
          className="flex-1 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <input
          placeholder="Name"
          value={cloneName}
          onChange={(e) => {
            setCloneName(e.target.value)
          }}
          className="w-32 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white"
        />
        <button
          type="button"
          disabled={!cloneUrl.trim() || !cloneName.trim() || cloneWorkspace.isPending}
          onClick={() => {
            cloneWorkspace.mutate({ url: cloneUrl.trim(), name: cloneName.trim() })
          }}
          className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Clone
        </button>
      </div>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-2">
          {workspaces?.map((ws) => (
            <div
              key={ws.id}
              className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div>
                <div className="text-sm text-zinc-100">{ws.name}</div>
                <div className="text-xs text-zinc-500 font-mono">{ws.path}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  deleteWorkspace.mutate(ws.id)
                }}
                className="text-xs text-zinc-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
          {(!workspaces || workspaces.length === 0) && (
            <p className="text-zinc-500 text-sm">No workspaces yet</p>
          )}
        </div>
      )}
    </div>
  )
}
