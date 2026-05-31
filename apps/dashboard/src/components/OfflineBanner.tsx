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

interface OfflineBannerProps {
  status: 'connected' | 'degraded' | 'reconnecting' | 'offline'
}

export function OfflineBanner({ status }: OfflineBannerProps) {
  if (status !== 'offline' && status !== 'reconnecting') return null

  const isOffline = status === 'offline'

  return (
    <div
      className="flex items-center gap-2 px-4 py-1.5 flex-shrink-0"
      style={{
        background: isOffline ? 'var(--color-red-muted)' : 'var(--color-yellow-muted)',
        borderBottom: `1px solid ${isOffline ? 'var(--color-red)' : 'var(--color-yellow)'}`,
      }}
    >
      {/* Icon */}
      <span
        className="flex-shrink-0"
        style={{ color: isOffline ? 'var(--color-red)' : 'var(--color-yellow)' }}
      >
        {isOffline ? (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 1l14 14M8 12.5a.5.5 0 110-.01M5.1 9.4A4 4 0 0111 11M3 7A7 7 0 0113 7M1.5 5A10 10 0 0114.5 5" />
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
            aria-hidden="true"
          >
            <path d="M13.5 5A6 6 0 002.5 8M2.5 11A6 6 0 0013.5 8M13.5 5v3h-3M2.5 11v-3h3" />
          </svg>
        )}
      </span>

      {/* Text */}
      <span
        className="text-xs font-medium"
        style={{ color: isOffline ? 'var(--color-red)' : 'var(--color-yellow)' }}
      >
        {isOffline ? 'Offline' : 'Reconnecting'}
      </span>
      <span className="text-xs text-[var(--color-text-dim)]">
        {isOffline ? 'No connection to server' : 'Attempting to reconnect...'}
      </span>
    </div>
  )
}
