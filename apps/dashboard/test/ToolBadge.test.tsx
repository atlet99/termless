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

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ToolBadge } from '../src/components/ToolBadge'

describe('ToolBadge', () => {
  it('renders OPENCODE tool', () => {
    render(<ToolBadge tool="OPENCODE" />)
    expect(screen.getByText('opencode')).toBeInTheDocument()
  })

  it('renders CLAUDE tool', () => {
    render(<ToolBadge tool="CLAUDE" />)
    expect(screen.getByText('claude')).toBeInTheDocument()
  })

  it('renders BASH tool', () => {
    render(<ToolBadge tool="BASH" />)
    expect(screen.getByText('bash')).toBeInTheDocument()
  })

  it('renders unknown tool with lowercase name', () => {
    render(<ToolBadge tool="CUSTOM_TOOL" />)
    expect(screen.getByText('custom_tool')).toBeInTheDocument()
  })
})
