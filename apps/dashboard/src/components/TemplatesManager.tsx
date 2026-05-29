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
import { ToolBadge } from './ToolBadge'

interface SessionTemplate {
  id: string
  name: string
  tool: string
  workingDir: string
  envVars?: string | null
  snippetIds: string[]
  createdAt: string
  updatedAt: string
}

const TOOLS = ['OPENCODE', 'CLAUDE', 'BASH'] as const

export function TemplatesManager() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    tool: 'OPENCODE',
    workingDir: '',
    envVars: '',
  })

  const { data: templates, isLoading } = useQuery<SessionTemplate[]>({
    queryKey: ['templates'],
    queryFn: () => api.get('/api/v1/templates'),
  })

  const createTemplate = useMutation({
    mutationFn: (data: { name: string; tool: string; workingDir: string; envVars?: string }) =>
      api.post('/api/v1/templates', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] })
      resetForm()
    },
  })

  const updateTemplate = useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string
      name: string
      tool: string
      workingDir: string
      envVars?: string
    }) => api.put(`/api/v1/templates/${id}`, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] })
      resetForm()
    },
  })

  const deleteTemplate = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/templates/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  const resetForm = () => {
    setForm({ name: '', tool: 'OPENCODE', workingDir: '', envVars: '' })
    setCreating(false)
    setEditingId(null)
  }

  const startEdit = (tpl: SessionTemplate) => {
    setForm({
      name: tpl.name,
      tool: tpl.tool,
      workingDir: tpl.workingDir,
      envVars: tpl.envVars ?? '',
    })
    setEditingId(tpl.id)
    setCreating(true)
  }

  const handleSubmit = () => {
    if (!form.name.trim() || !form.workingDir.trim()) return
    const data = {
      name: form.name.trim(),
      tool: form.tool,
      workingDir: form.workingDir.trim(),
      ...(form.envVars.trim() && { envVars: form.envVars.trim() }),
    }
    if (editingId) {
      updateTemplate.mutate({ id: editingId, ...data })
    } else {
      createTemplate.mutate(data)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-lg font-semibold text-[var(--color-text)]">{t('sidebar.templates')}</h1>
        {!creating && (
          <button
            type="button"
            onClick={() => {
              setCreating(true)
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-text-inverse)',
            }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 3v10M3 8h10" />
            </svg>
            {t('templates.new')}
          </button>
        )}
      </div>

      {/* Create / Edit form */}
      {creating && (
        <div
          className="mb-6 p-4 rounded-xl border"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-accent)',
          }}
        >
          <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">
            {editingId ? t('templates.edit') : t('templates.new')}
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Name */}
            <div>
              <span className="block text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider mb-1.5">
                {t('templates.name')}
              </span>
              <input
                value={form.name}
                onChange={(e) => {
                  setForm((f) => ({ ...f, name: e.target.value }))
                }}
                placeholder={t('templates.namePlaceholder')}
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] font-mono"
              />
            </div>

            {/* Tool */}
            <div>
              <span className="block text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider mb-1.5">
                {t('templates.tool')}
              </span>
              <div className="flex gap-2">
                {TOOLS.map((tool) => (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => {
                      setForm((f) => ({ ...f, tool }))
                    }}
                    className="flex-1 px-3 py-2 rounded-md text-xs font-mono transition-colors border cursor-pointer"
                    style={{
                      background: form.tool === tool ? 'var(--color-accent-muted)' : 'transparent',
                      borderColor:
                        form.tool === tool ? 'var(--color-accent)' : 'var(--color-border)',
                      color: form.tool === tool ? 'var(--color-accent)' : 'var(--color-text-dim)',
                    }}
                  >
                    {tool.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Working dir */}
          <div className="mb-3">
            <span className="block text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider mb-1.5">
              {t('templates.workingDir')}
            </span>
            <input
              value={form.workingDir}
              onChange={(e) => {
                setForm((f) => ({ ...f, workingDir: e.target.value }))
              }}
              placeholder={t('templates.workingDirPlaceholder')}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-accent)] outline-none transition-colors focus:border-[var(--color-accent)] font-mono"
            />
          </div>

          {/* Env vars */}
          <div className="mb-4">
            <span className="block text-[10px] text-[var(--color-text-dim)] uppercase tracking-wider mb-1.5">
              {t('templates.envVars')}
            </span>
            <input
              value={form.envVars}
              onChange={(e) => {
                setForm((f) => ({ ...f, envVars: e.target.value }))
              }}
              placeholder={t('templates.envVarsPlaceholder')}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] rounded-md px-3 py-2 text-sm text-[var(--color-text)] outline-none transition-colors focus:border-[var(--color-accent)] font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-full text-sm border border-[var(--color-border)] text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              disabled={
                !form.name.trim() ||
                !form.workingDir.trim() ||
                createTemplate.isPending ||
                updateTemplate.isPending
              }
              onClick={handleSubmit}
              className="px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text-inverse)',
              }}
            >
              {editingId ? t('templates.save') : t('templates.create')}
            </button>
          </div>
        </div>
      )}

      {/* Templates list */}
      {isLoading ? (
        <p className="text-[var(--color-text-dim)] text-sm">{t('common.loading')}</p>
      ) : (
        <div className="space-y-2">
          {templates?.map((tpl) => (
            <div
              key={tpl.id}
              className="flex items-center gap-4 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl transition-colors hover:border-[var(--color-accent)]"
            >
              {/* Tool indicator */}
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  background:
                    tpl.tool === 'OPENCODE'
                      ? 'var(--color-tool-opencode)'
                      : tpl.tool === 'CLAUDE'
                        ? 'var(--color-tool-claude)'
                        : 'var(--color-tool-bash)',
                  boxShadow: `0 0 6px ${
                    tpl.tool === 'OPENCODE'
                      ? 'var(--color-tool-opencode)'
                      : tpl.tool === 'CLAUDE'
                        ? 'var(--color-tool-claude)'
                        : 'var(--color-tool-bash)'
                  }60`,
                }}
              />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-[var(--color-text)]">{tpl.name}</span>
                  <ToolBadge tool={tpl.tool} />
                </div>
                <div className="flex gap-4">
                  <span className="text-xs text-[var(--color-text-dim)] font-mono truncate">
                    {tpl.workingDir || '—'}
                  </span>
                  {tpl.envVars && (
                    <span className="text-xs text-[var(--color-text-dim)]">
                      {tpl.envVars.split(',').length} env vars
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    startEdit(tpl)
                  }}
                  className="px-3 py-1 text-xs border border-[var(--color-border)] rounded-full text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                >
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    deleteTemplate.mutate(tpl.id)
                  }}
                  className="px-3 py-1 text-xs border border-[var(--color-border)] rounded-full text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
                >
                  {t('common.delete')}
                </button>
              </div>
            </div>
          ))}
          {(!templates || templates.length === 0) && (
            <p className="text-[var(--color-text-dim)] text-sm">{t('templates.empty')}</p>
          )}
        </div>
      )}
    </div>
  )
}
