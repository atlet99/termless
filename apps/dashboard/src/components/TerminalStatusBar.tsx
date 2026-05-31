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

import { ToolBadge } from './ToolBadge'

interface TerminalStatusBarProps {
  tool: string | undefined
  encoding?: string
  cols?: number
  rows?: number
  onKill?: () => void
}

export function TerminalStatusBar({
  tool,
  encoding = 'UTF-8',
  cols,
  rows,
  onKill,
}: TerminalStatusBarProps) {
  return (
    <div className="h-7 flex-shrink-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center px-3 gap-3">
      {/* System panel toggle */}
      <button
        type="button"
        className="w-5 h-5 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
        title="Toggle system panel"
        aria-label="Toggle system panel"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6l5 5 5-5" />
        </svg>
      </button>

      <span className="w-px h-3.5 bg-[var(--color-border)]" />

      {/* Tool badge */}
      {tool && <ToolBadge tool={tool} />}

      <span className="w-px h-3.5 bg-[var(--color-border)]" />

      {/* Encoding */}
      <span className="text-[10px] text-[var(--color-text-dim)] font-mono">{encoding}</span>

      <span className="w-px h-3.5 bg-[var(--color-border)]" />

      {/* Dimensions */}
      {cols !== undefined && rows !== undefined && (
        <>
          <span className="text-[10px] text-[var(--color-text-dim)] font-mono">
            {cols}x{rows}
          </span>
          <span className="w-px h-3.5 bg-[var(--color-border)]" />
        </>
      )}

      {/* Line ending */}
      <span className="text-[10px] text-[var(--color-text-dim)] font-mono">LF</span>

      {/* Spacer */}
      <span className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="px-2 py-0.5 text-[10px] border border-[var(--color-border)] rounded text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          Search
        </button>
        <button
          type="button"
          className="px-2 py-0.5 text-[10px] border border-[var(--color-border)] rounded text-[var(--color-text-dim)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          End
        </button>
        {onKill && (
          <button
            type="button"
            onClick={onKill}
            className="px-2 py-0.5 text-[10px] border border-[var(--color-border)] rounded text-[var(--color-text-dim)] hover:border-[var(--color-red)] hover:text-[var(--color-red)] transition-colors"
          >
            Kill
          </button>
        )}
      </div>
    </div>
  )
}
