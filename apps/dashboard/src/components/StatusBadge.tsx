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

type ConnectionStatus = 'connected' | 'degraded' | 'reconnecting' | 'offline'

interface StatusBadgeProps {
  status: ConnectionStatus
}

const statusConfig = {
  connected: {
    dotClass: 'bg-[var(--color-green)]',
    bgClass: 'bg-[var(--color-green-muted)]',
    textClass: 'text-[var(--color-green)]',
    label: 'Connected',
    pulse: false,
  },
  degraded: {
    dotClass: 'bg-[var(--color-yellow)]',
    bgClass: 'bg-[var(--color-yellow-muted)]',
    textClass: 'text-[var(--color-yellow)]',
    label: 'Degraded',
    pulse: false,
  },
  reconnecting: {
    dotClass: 'bg-[var(--color-accent)]',
    bgClass: 'bg-[var(--color-accent-muted)]',
    textClass: 'text-[var(--color-accent)]',
    label: 'Reconnecting',
    pulse: true,
  },
  offline: {
    dotClass: 'bg-[var(--color-red)]',
    bgClass: 'bg-[var(--color-red-muted)]',
    textClass: 'text-[var(--color-red)]',
    label: 'Offline',
    pulse: false,
  },
} as const

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${config.bgClass} ${config.textClass}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dotClass} ${config.pulse ? 'animate-pulse' : ''}`}
      />
      {config.label}
    </span>
  )
}
