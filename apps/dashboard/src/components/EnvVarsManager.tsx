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

interface EnvVar {
  id: string
  name: string
  maskedValue: string
  createdAt: string
  updatedAt: string
}

export function EnvVarsManager() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [showValue, setShowValue] = useState(false)

  const { data: envVars, isLoading } = useQuery<EnvVar[]>({
    queryKey: ['env-vars'],
    queryFn: () => api.get<{ data: EnvVar[] }>('/api/v1/env-vars').then((r) => r.data),
  })

  const upsertEnvVar = useMutation({
    mutationFn: (data: { name: string; value: string }) => api.post('/api/v1/env-vars', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['env-vars'] })
      setName('')
      setValue('')
    },
  })

  const deleteEnvVar = useMutation({
    mutationFn: (varName: string) =>
      fetch(`/api/v1/env-vars/${encodeURIComponent(varName)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('termless_token') ?? ''}`,
        },
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['env-vars'] })
    },
  })

  return (
    <div className="flex h-full flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold text-white">Environment Variables</h2>

      <div className="flex gap-2">
        <input
          placeholder="Name (e.g. ANTHROPIC_API_KEY)"
          value={name}
          onChange={(e) => {
            setName(e.target.value.toUpperCase())
          }}
          className="w-48 rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white font-mono"
        />
        <div className="relative flex-1">
          <input
            type={showValue ? 'text' : 'password'}
            placeholder="Value"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
            }}
            className="w-full rounded border border-gray-600 bg-gray-800 px-2 py-1 text-sm text-white font-mono pr-8"
          />
          <button
            type="button"
            onClick={() => {
              setShowValue(!showValue)
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300"
          >
            {showValue ? 'Hide' : 'Show'}
          </button>
        </div>
        <button
          type="button"
          disabled={!name.trim() || !value.trim() || upsertEnvVar.isPending}
          onClick={() => {
            upsertEnvVar.mutate({ name: name.trim(), value: value.trim() })
          }}
          className="rounded bg-purple-600 px-3 py-1.5 text-sm text-white hover:bg-purple-500 disabled:opacity-50"
        >
          Save
        </button>
      </div>

      <p className="text-xs text-zinc-500">
        Values are encrypted with AES-256-GCM. Only masked values are shown.
      </p>

      {isLoading ? (
        <div className="text-gray-400">Loading...</div>
      ) : (
        <div className="space-y-2">
          {envVars?.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-3 bg-zinc-900 border border-zinc-800 rounded-lg"
            >
              <div className="flex-1">
                <div className="text-sm text-zinc-100 font-mono">{v.name}</div>
                <div className="text-xs text-zinc-500 font-mono">{v.maskedValue}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  deleteEnvVar.mutate(v.name)
                }}
                className="text-xs text-zinc-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
          {(!envVars || envVars.length === 0) && (
            <p className="text-zinc-500 text-sm">No environment variables configured</p>
          )}
        </div>
      )}
    </div>
  )
}
