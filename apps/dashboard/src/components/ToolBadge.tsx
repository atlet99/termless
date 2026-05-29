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

interface ToolBadgeProps {
  tool: string
}

interface ToolConfig {
  dotClass: string
  textClass: string
  bgClass: string
  label: string
}

const toolConfig: Record<string, ToolConfig> = {
  OPENCODE: {
    dotClass: 'bg-[var(--color-tool-opencode)]',
    textClass: 'text-[var(--color-tool-opencode)]',
    bgClass: 'bg-[var(--color-green-muted)]',
    label: 'opencode',
  },
  CLAUDE: {
    dotClass: 'bg-[var(--color-tool-claude)]',
    textClass: 'text-[var(--color-tool-claude)]',
    bgClass: 'bg-[var(--color-purple-muted)]',
    label: 'claude',
  },
  BASH: {
    dotClass: 'bg-[var(--color-tool-bash)]',
    textClass: 'text-[var(--color-tool-bash)]',
    bgClass: 'bg-[var(--color-yellow-muted)]',
    label: 'bash',
  },
}

export function ToolBadge({ tool }: ToolBadgeProps) {
  const config = toolConfig[tool] ?? {
    dotClass: 'bg-[var(--color-text-dim)]',
    textClass: 'text-[var(--color-text-dim)]',
    bgClass: 'bg-[var(--color-surface-3)]',
    label: tool.toLowerCase(),
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${config.bgClass} ${config.textClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotClass}`} />
      {config.label}
    </span>
  )
}
