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
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TerminalStatusBar } from '../src/components/TerminalStatusBar'

describe('TerminalStatusBar', () => {
  it('renders encoding', () => {
    render(<TerminalStatusBar />)
    expect(screen.getByText('UTF-8')).toBeInTheDocument()
  })

  it('renders custom encoding', () => {
    render(<TerminalStatusBar encoding="ASCII" />)
    expect(screen.getByText('ASCII')).toBeInTheDocument()
  })

  it('renders dimensions when provided', () => {
    render(<TerminalStatusBar cols={120} rows={40} />)
    expect(screen.getByText('120x40')).toBeInTheDocument()
  })

  it('renders tool badge when provided', () => {
    render(<TerminalStatusBar tool="OPENCODE" />)
    expect(screen.getByText('opencode')).toBeInTheDocument()
  })

  it('renders LF line ending', () => {
    render(<TerminalStatusBar />)
    expect(screen.getByText('LF')).toBeInTheDocument()
  })

  it('renders kill button when onKill provided', () => {
    render(<TerminalStatusBar onKill={vi.fn()} />)
    expect(screen.getByText('Kill')).toBeInTheDocument()
  })

  it('does not render kill button when onKill not provided', () => {
    render(<TerminalStatusBar />)
    expect(screen.queryByText('Kill')).not.toBeInTheDocument()
  })

  it('calls onKill when kill button is clicked', async () => {
    const onKill = vi.fn()
    const user = userEvent.setup()
    render(<TerminalStatusBar onKill={onKill} />)
    await user.click(screen.getByText('Kill'))
    expect(onKill).toHaveBeenCalledTimes(1)
  })
})
