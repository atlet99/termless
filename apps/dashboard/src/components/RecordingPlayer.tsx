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

import { useEffect, useRef } from 'react'
import 'asciinema-player/dist/bundle/asciinema-player.css'

interface RecordingPlayerProps {
  src: string
  autoPlay?: boolean
  loop?: boolean
  speed?: number
  idleTimeLimit?: number | undefined
}

export function RecordingPlayer({
  src,
  autoPlay = false,
  loop = false,
  speed = 1,
  idleTimeLimit,
}: RecordingPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<unknown>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let cancelled = false

    const init = async () => {
      const AsciinemaPlayer = await import('asciinema-player')
      if (cancelled || !containerRef.current) return

      playerRef.current = AsciinemaPlayer.create(src, containerRef.current, {
        autoPlay,
        loop,
        speed,
        idleTimeLimit,
        theme: 'monokai',
        fit: 'width',
      })
    }

    void init()

    return () => {
      cancelled = true
      if (
        playerRef.current &&
        typeof (playerRef.current as { dispose?: () => void }).dispose === 'function'
      ) {
        ;(playerRef.current as { dispose: () => void }).dispose()
      }
      playerRef.current = null
    }
  }, [src, autoPlay, loop, speed, idleTimeLimit])

  return <div ref={containerRef} className="w-full" />
}
