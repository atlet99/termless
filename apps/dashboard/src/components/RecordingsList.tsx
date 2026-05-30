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
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { api } from '../lib/api'

interface Recording {
  id: string
  userId: string
  sessionId: string
  title: string | null
  filePath: string
  duration: number | null
  sizeBytes: number
  createdAt: string
}

export function RecordingsList() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()

  const { data: recordings, isLoading } = useQuery<Recording[]>({
    queryKey: ['recordings'],
    queryFn: () => api.get('/api/v1/recordings'),
  })

  const deleteRecording = useMutation({
    mutationFn: (id: string) => api.delete(`/api/v1/recordings/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['recordings'] })
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return '—'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (isLoading) {
    return <p className="text-[var(--color-text-dim)] p-4">{t('common.loading')}</p>
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-[var(--color-text)] mb-6">
        {t('recordings.title')}
      </h1>

      <div className="space-y-2">
        {recordings?.map((rec) => (
          <div
            key={rec.id}
            className="flex items-center justify-between p-4 rounded-xl transition-colors hover:border-[var(--color-accent)]"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="flex-1">
              <div className="text-sm text-[var(--color-text)]">{rec.title ?? rec.sessionId}</div>
              <div className="flex gap-4 text-xs text-[var(--color-text-dim)] mt-1">
                <span>{formatDuration(rec.duration)}</span>
                <span>{formatBytes(rec.sizeBytes)}</span>
                <span>{new Date(rec.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <a
                href={`/api/v1/recordings/${rec.id}/stream`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--color-accent)] hover:underline"
              >
                {t('recordings.download')}
              </a>
              <button
                type="button"
                onClick={() => {
                  deleteRecording.mutate(rec.id)
                }}
                className="text-xs border border-[var(--color-border)] rounded-full px-3 py-1 text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
              >
                {t('common.delete')}
              </button>
            </div>
          </div>
        ))}
        {(!recordings || recordings.length === 0) && (
          <p className="text-[var(--color-text-dim)] text-sm">{t('recordings.empty')}</p>
        )}
      </div>
    </div>
  )
}
