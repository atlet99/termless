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
import { CommandPalette } from '../src/components/CommandPalette'

const mockSnippets = [
  { id: '1', name: 'Restart API', command: 'docker compose restart api', tags: ['docker'] },
  { id: '2', name: 'Run tests', command: 'pnpm test', tags: ['test'] },
]

const defaultProps = {
  snippets: mockSnippets,
  onNavigate: vi.fn(),
  onNewSession: vi.fn(),
  onSelectSnippet: vi.fn(),
  onClose: vi.fn(),
}

describe('CommandPalette', () => {
  it('renders with search input', () => {
    render(<CommandPalette {...defaultProps} />)
    expect(screen.getByLabelText('Search commands')).toBeInTheDocument()
  })

  it('shows all groups by default', () => {
    render(<CommandPalette {...defaultProps} />)
    expect(screen.getByText('Navigate')).toBeInTheDocument()
    expect(screen.getAllByText('Sessions').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('Snippets').length).toBeGreaterThanOrEqual(1)
  })

  it('shows navigation items', () => {
    render(<CommandPalette {...defaultProps} />)
    expect(screen.getByText('Terminal')).toBeInTheDocument()
    expect(screen.getByText('Workspaces')).toBeInTheDocument()
    expect(screen.getByText('Templates')).toBeInTheDocument()
  })

  it('shows session creation items', () => {
    render(<CommandPalette {...defaultProps} />)
    expect(screen.getByText('New opencode session')).toBeInTheDocument()
    expect(screen.getByText('New claude session')).toBeInTheDocument()
    expect(screen.getByText('New bash session')).toBeInTheDocument()
  })

  it('shows snippets', () => {
    render(<CommandPalette {...defaultProps} />)
    expect(screen.getByText('Restart API')).toBeInTheDocument()
    expect(screen.getByText('Run tests')).toBeInTheDocument()
  })

  it('filters items by query', async () => {
    const user = userEvent.setup()
    render(<CommandPalette {...defaultProps} />)
    const input = screen.getByLabelText('Search commands')
    await user.type(input, 'restart')
    expect(screen.getByText('Restart API')).toBeInTheDocument()
    expect(screen.queryByText('Run tests')).not.toBeInTheDocument()
  })

  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<CommandPalette {...defaultProps} onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onNavigate when navigation item is clicked', async () => {
    const onNavigate = vi.fn()
    const user = userEvent.setup()
    render(<CommandPalette {...defaultProps} onNavigate={onNavigate} />)
    await user.click(screen.getByText('Terminal'))
    expect(onNavigate).toHaveBeenCalledWith('terminal')
  })

  it('calls onNewSession when session item is clicked', async () => {
    const onNewSession = vi.fn()
    const user = userEvent.setup()
    render(<CommandPalette {...defaultProps} onNewSession={onNewSession} />)
    await user.click(screen.getByText('New opencode session'))
    expect(onNewSession).toHaveBeenCalledWith('OPENCODE')
  })

  it('calls onSelectSnippet when snippet is clicked', async () => {
    const onSelectSnippet = vi.fn()
    const user = userEvent.setup()
    render(<CommandPalette {...defaultProps} onSelectSnippet={onSelectSnippet} />)
    await user.click(screen.getByText('Restart API'))
    expect(onSelectSnippet).toHaveBeenCalledWith('docker compose restart api')
  })
})
