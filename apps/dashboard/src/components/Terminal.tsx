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
import { WebLinksAddon } from '@xterm/addon-web-links'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import { useEffect, useRef } from 'react'

interface TerminalViewProps {
  sessionId: string
}

export function TerminalView({ sessionId }: TerminalViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 15,
      fontFamily: 'JetBrains Mono, Cascadia Code, monospace',
      theme: {
        foreground: '#a9b1d6',
        background: '#1a1b26',
        cursor: '#c0caf5',
        cursorAccent: '#1a1b26',
        selectionBackground: '#33467c',
        black: '#15161e',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#bb9af7',
        cyan: '#7dcfff',
        white: '#a9b1d6',
      },
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    term.open(containerRef.current)

    try {
      term.loadAddon(new WebglAddon())
    } catch {
      // WebGL not available, fallback to canvas
    }

    fitAddon.fit()
    termRef.current = term

    const token = localStorage.getItem('termless_token')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/terminal/${sessionId}`
    const socket = new WebSocket(wsUrl, ['bearer', token ?? ''].join('.'))

    socket.onopen = () => {
      term.writeln('\x1b[1;32mConnected to Termless terminal\x1b[0m\r')
    }

    socket.onmessage = (event) => {
      const data =
        typeof event.data === 'string'
          ? event.data
          : new TextDecoder().decode(event.data as ArrayBuffer)
      term.write(data)
    }

    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(data)
      }
    })

    term.onSelectionChange(() => {
      const sel = term.getSelection()
      if (sel.length > 0) {
        navigator.clipboard.writeText(sel).catch(() => {
          void 0 // clipboard copy fallback deprecated, ignore
        })
      }
    })

    term.attachCustomKeyEventHandler((e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault()
        navigator.clipboard
          .readText()
          .then((text) => {
            if (socket.readyState === WebSocket.OPEN) {
              socket.send(`\x1b[200~${text}\x1b[201~`)
            }
          })
          .catch(() => {
            // ignore clipboard read errors
          })
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
      socket.close()
      term.dispose()
    }
  }, [sessionId])

  return <div ref={containerRef} className="h-full w-full" />
}
