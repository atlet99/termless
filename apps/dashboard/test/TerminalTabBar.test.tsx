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
import { TerminalTabBar } from '../src/components/TerminalTabBar'

const mockTabs = [
  { id: '1', name: 'session-1', tool: 'OPENCODE' },
  { id: '2', name: 'session-2', tool: 'CLAUDE' },
  { id: '3', name: 'session-3', tool: 'BASH' },
]

describe('TerminalTabBar', () => {
  it('renders all tabs', () => {
    render(
      <TerminalTabBar
        tabs={mockTabs}
        activeId="1"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />,
    )
    expect(screen.getByText('session-1')).toBeInTheDocument()
    expect(screen.getByText('session-2')).toBeInTheDocument()
    expect(screen.getByText('session-3')).toBeInTheDocument()
  })

  it('renders add button', () => {
    render(
      <TerminalTabBar
        tabs={mockTabs}
        activeId="1"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('New session')).toBeInTheDocument()
  })

  it('calls onAdd when add button is clicked', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()
    render(
      <TerminalTabBar
        tabs={mockTabs}
        activeId="1"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onAdd={onAdd}
      />,
    )
    await user.click(screen.getByLabelText('New session'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onSelect when tab is clicked', async () => {
    const onSelect = vi.fn()
    const user = userEvent.setup()
    render(
      <TerminalTabBar
        tabs={mockTabs}
        activeId="1"
        onSelect={onSelect}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />,
    )
    await user.click(screen.getByText('session-2'))
    expect(onSelect).toHaveBeenCalledWith('2')
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(
      <TerminalTabBar
        tabs={mockTabs}
        activeId="1"
        onSelect={vi.fn()}
        onClose={onClose}
        onAdd={vi.fn()}
      />,
    )
    const closeButtons = screen.getAllByLabelText('Close tab')
    await user.click(closeButtons[0]!)
    expect(onClose).toHaveBeenCalledWith('1')
  })

  it('renders share and record buttons', () => {
    render(
      <TerminalTabBar
        tabs={mockTabs}
        activeId="1"
        onSelect={vi.fn()}
        onClose={vi.fn()}
        onAdd={vi.fn()}
      />,
    )
    expect(screen.getByLabelText('Share session')).toBeInTheDocument()
    expect(screen.getByLabelText('Record session')).toBeInTheDocument()
  })
})
