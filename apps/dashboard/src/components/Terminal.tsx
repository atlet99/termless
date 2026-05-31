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

import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef, useState } from 'react'
import i18n from '../i18n'
import { TERMINAL_THEMES } from '../lib/terminal-themes'

interface TerminalViewProps {
  sessionId: string
  theme?: string
  fontFamily?: string
  fontSize?: number
  cursorStyle?: string
}

export function TerminalView({
  sessionId,
  theme = 'tokyo-night',
  fontFamily = 'JetBrains Mono',
  fontSize = 15,
  cursorStyle = 'block',
}: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const [reconnectAttempt, setReconnectAttempt] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!containerRef.current) return

    const termTheme = TERMINAL_THEMES[theme] ?? TERMINAL_THEMES['tokyo-night']
    if (!termTheme) return

    const term = new Terminal({
      cursorBlink: cursorStyle !== 'block',
      cursorStyle: cursorStyle as 'block' | 'underline' | 'bar',
      fontSize,
      fontFamily: `${fontFamily}, Cascadia Code, monospace`,
      theme: termTheme,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    const searchAddon = new SearchAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.loadAddon(searchAddon)
    searchAddonRef.current = searchAddon

    term.open(containerRef.current)

    try {
      term.loadAddon(new WebglAddon())
    } catch {
      // WebGL not available, fallback to canvas
    }

    fitAddon.fit()
    termRef.current = term

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let attempt = 0

    function connect() {
      const token = localStorage.getItem('termless_token')
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${sessionId}`
      socket = new WebSocket(wsUrl, ['bearer', token ?? ''].join('.'))

      socket.onopen = () => {
        attempt = 0
        setReconnectAttempt(0)
        setIsConnected(true)
        term.writeln(`\x1b[1;32m${i18n.t('session.connected')}\x1b[0m\r`)
      }

      socket.onmessage = (event) => {
        const data =
          typeof event.data === 'string'
            ? event.data
            : new TextDecoder().decode(event.data as ArrayBuffer)
        term.write(data)
      }

      socket.onclose = () => {
        setIsConnected(false)
        attempt++
        setReconnectAttempt(attempt)
        const delay = Math.min(1000 * 2 ** (attempt - 1), 30_000)
        term.writeln(
          `\r\n\x1b[1;33mReconnecting... (attempt ${attempt}, ${Math.round(delay / 1000)}s)\x1b[0m\r`,
        )
        reconnectTimer = setTimeout(connect, delay)
      }

      socket.onerror = () => {
        socket?.close()
      }
    }

    connect()

    term.onData((data) => {
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(data)
      }
    })

    term.onSelectionChange(() => {
      const sel = term.getSelection()
      if (sel.length > 0) {
        navigator.clipboard.writeText(sel).catch(() => {
          void 0
        })
      }
    })

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        navigator.clipboard
          .readText()
          .then((text) => {
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(`\x1b[200~${text}\x1b[201~`)
            }
          })
          .catch(() => {
            // ignore clipboard read errors
          })
        return false
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault()
        setShowSearch((prev) => !prev)
        return false
      }
      return true
    })

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close()
      term.dispose()
    }
  }, [sessionId, theme, fontFamily, fontSize, cursorStyle])

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {showSearch && (
        <div
          className="absolute top-2 right-2 flex items-center gap-2 rounded-lg px-3 py-2 shadow-lg"
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
          }}
        >
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              searchAddonRef.current?.findNext(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (e.shiftKey) {
                  searchAddonRef.current?.findPrevious(searchQuery)
                } else {
                  searchAddonRef.current?.findNext(searchQuery)
                }
              }
              if (e.key === 'Escape') {
                setShowSearch(false)
                setSearchQuery('')
              }
            }}
            placeholder="Search..."
            className="w-48 bg-transparent text-sm outline-none"
            style={{ color: 'var(--color-text)' }}
            ref={(input) => {
              if (input) input.focus()
            }}
          />
          <button
            type="button"
            onClick={() => {
              searchAddonRef.current?.findPrevious(searchQuery)
            }}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            &uarr;
          </button>
          <button
            type="button"
            onClick={() => {
              searchAddonRef.current?.findNext(searchQuery)
            }}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            &darr;
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSearch(false)
              setSearchQuery('')
            }}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            &times;
          </button>
        </div>
      )}
      {!isConnected && reconnectAttempt > 0 && (
        <div
          className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
          style={{ background: 'var(--color-overlay)' }}
        >
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-8 w-8 animate-spin rounded-full border-2"
              style={{
                borderColor: 'var(--color-text-dim)',
                borderTopColor: 'var(--color-accent)',
              }}
            />
            <p className="text-sm text-[var(--color-text-dim)]">
              Reconnecting... (attempt {reconnectAttempt})
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
