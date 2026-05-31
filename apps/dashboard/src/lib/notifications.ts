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

import { useEffect, useRef, useState } from 'react'

export interface NotificationEvent {
  type: string
  timestamp: string
  data: Record<string, unknown>
}

export function useNotifications(token: string | null) {
  const [events, setEvents] = useState<NotificationEvent[]>([])
  const [connected, setConnected] = useState(false)
  const sourceRef = useRef<EventSource | null>(null)
  const retryCountRef = useRef(0)
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!token) return

    function connect() {
      const url = `/api/v1/events`
      const source = new EventSource(url, {
        withCredentials: true,
      })

      source.onopen = () => {
        setConnected(true)
        retryCountRef.current = 0
      }

      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as NotificationEvent
          setEvents((prev) => [...prev.slice(-99), parsed])
        } catch {
          // ignore parse errors
        }
      }

      source.onerror = () => {
        setConnected(false)
        source.close()
        // Reconnect with exponential backoff (max 30s)
        const delay = Math.min(1000 * 2 ** retryCountRef.current, 30_000)
        retryCountRef.current++
        retryTimeoutRef.current = setTimeout(() => {
          connect()
        }, delay)
      }

      sourceRef.current = source
    }

    connect()

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
      if (sourceRef.current) {
        sourceRef.current.close()
        sourceRef.current = null
      }
    }
  }, [token])

  return { events, connected }
}
