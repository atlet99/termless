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

interface EnvVar {
  id: string
  name: string
  maskedValue: string
  createdAt: string
  updatedAt: string
}

const inputStyle = {
  background: 'var(--color-surface-2)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text)',
}

export function EnvVarsManager() {
  const { t } = useTranslation()
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
    mutationFn: (varName: string) => api.delete(`/api/v1/env-vars/${encodeURIComponent(varName)}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['env-vars'] })
    },
  })

  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-6">{t('envVars.title')}</h1>

      <div
        className="flex gap-3 mb-4 p-4 rounded-xl"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <input
          placeholder={t('envVars.name')}
          value={name}
          onChange={(e) => {
            setName(e.target.value.toUpperCase())
          }}
          className="w-48 rounded-md px-3 py-2 text-sm outline-none font-mono"
          style={inputStyle}
        />
        <div className="relative flex-1">
          <input
            type={showValue ? 'text' : 'password'}
            placeholder={t('envVars.value')}
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
            }}
            className="w-full rounded-md px-3 py-2 text-sm outline-none font-mono pr-12"
            style={inputStyle}
          />
          <button
            type="button"
            onClick={() => {
              setShowValue(!showValue)
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
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
          className="rounded-md px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'var(--color-accent)',
            color: 'var(--color-text-inverse)',
          }}
        >
          {t('envVars.save')}
        </button>
      </div>

      <p className="text-xs text-[var(--color-text-dim)] mb-4">{t('envVars.encrypted')}</p>

      {isLoading ? (
        <p className="text-[var(--color-text-dim)] text-sm">{t('common.loading')}</p>
      ) : (
        <div className="space-y-2">
          {envVars?.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between p-4 rounded-xl transition-colors hover:border-[var(--color-accent)]"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex-1">
                <div className="text-sm text-[var(--color-text)] font-mono">{v.name}</div>
                <div className="text-xs text-[var(--color-text-dim)] font-mono mt-1">
                  {v.maskedValue}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  deleteEnvVar.mutate(v.name)
                }}
                className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          ))}
          {(!envVars || envVars.length === 0) && (
            <p className="text-[var(--color-text-dim)] text-sm">{t('envVars.empty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
