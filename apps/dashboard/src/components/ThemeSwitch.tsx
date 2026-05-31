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

interface ThemeSwitchProps {
  isDark: boolean
  onToggle: () => void
}

export function ThemeSwitch({ isDark, onToggle }: ThemeSwitchProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative w-[52px] h-8 rounded-full cursor-pointer flex-shrink-0 transition-colors duration-300 border-2"
      style={{
        background: isDark ? 'var(--color-surface-3)' : 'var(--color-accent-muted)',
        borderColor: isDark ? 'var(--color-text-dim)' : 'var(--color-accent)',
      }}
    >
      {/* Sun icon */}
      <span
        className="absolute left-1 top-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{
          opacity: isDark ? 0 : 1,
          color: 'var(--color-accent)',
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
          <circle cx="8" cy="8" r="3" />
          <path d="M8 1.5v1.7M8 12.8v1.7M1.5 8h1.7M12.8 8h1.7M3.4 3.4l1.2 1.2M11.4 11.4l1.2 1.2M3.4 12.6l1.2-1.2M11.4 4.6l1.2-1.2" />
        </svg>
      </span>
      {/* Moon icon */}
      <span
        className="absolute right-1 top-1/2 -translate-y-1/2 transition-opacity duration-200"
        style={{
          opacity: isDark ? 1 : 0,
          color: 'var(--color-text-dim)',
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
          <path d="M12.5 10A5.5 5.5 0 016.5 2a5.5 5.5 0 100 11 5.5 5.5 0 006-3z" />
        </svg>
      </span>
      {/* Thumb */}
      <span
        className="absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300"
        style={{
          background: isDark ? 'var(--color-text-dim)' : 'var(--color-accent)',
          left: isDark ? '2px' : '22px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          transitionTimingFunction: 'cubic-bezier(.34,1.56,.64,1)',
        }}
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 16 16"
          fill="none"
          stroke="white"
          strokeWidth="1.35"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {isDark ? (
            <path d="M12.5 10A5.5 5.5 0 016.5 2a5.5 5.5 0 100 11 5.5 5.5 0 006-3z" />
          ) : (
            <>
              <circle cx="8" cy="8" r="3" />
              <path d="M8 1.5v1.7M8 12.8v1.7M1.5 8h1.7M12.8 8h1.7M3.4 3.4l1.2 1.2M11.4 11.4l1.2 1.2M3.4 12.6l1.2-1.2M11.4 4.6l1.2-1.2" />
            </>
          )}
        </svg>
      </span>
    </button>
  )
}
