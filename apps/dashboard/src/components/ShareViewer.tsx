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

interface ShareViewerProps {
  shareToken: string
}

export function ShareViewer({ shareToken }: ShareViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: false,
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
      disableStdin: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()

    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)

    term.open(containerRef.current)

    try {
      term.loadAddon(new WebglAddon())
    } catch {
      // WebGL not available
    }

    fitAddon.fit()

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/view/${shareToken}`
    const socket = new WebSocket(wsUrl)

    socket.onopen = () => {
      term.writeln('\x1b[1;33m[Read-Only Viewer]\x1b[0m\r')
    }

    socket.onmessage = (event) => {
      const data =
        typeof event.data === 'string'
          ? event.data
          : new TextDecoder().decode(event.data as ArrayBuffer)
      term.write(data)
    }

    socket.onclose = () => {
      term.writeln('\r\n\x1b[1;31m[Connection closed]\x1b[0m\r')
    }

    const resizeObserver = new ResizeObserver(() => {
      fitAddon.fit()
    })
    resizeObserver.observe(containerRef.current)

    return () => {
      resizeObserver.disconnect()
      socket.close()
      term.dispose()
    }
  }, [shareToken])

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      <header className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-300">Termless</span>
          <span className="px-2 py-0.5 bg-yellow-600/20 text-yellow-400 text-xs rounded">
            Read-Only
          </span>
        </div>
      </header>
      <div ref={containerRef} className="flex-1" />
    </div>
  )
}
