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
import { TopBar } from '../src/components/TopBar'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}))

describe('TopBar', () => {
  const defaultProps = {
    connectionStatus: 'connected' as const,
    onOpenPalette: vi.fn(),
    isDark: true,
    onToggleTheme: vi.fn(),
    onLogout: vi.fn(),
    userEmail: 'user@example.com',
  }

  it('renders logo', () => {
    render(<TopBar {...defaultProps} />)
    expect(screen.getByText('termless')).toBeInTheDocument()
  })

  it('renders search button', () => {
    render(<TopBar {...defaultProps} />)
    expect(screen.getByText('Search')).toBeInTheDocument()
  })

  it('renders user email', () => {
    render(<TopBar {...defaultProps} />)
    expect(screen.getByText('user@example.com')).toBeInTheDocument()
  })

  it('renders user initials', () => {
    render(<TopBar {...defaultProps} />)
    expect(screen.getByText('U')).toBeInTheDocument()
  })

  it('renders logout button', () => {
    render(<TopBar {...defaultProps} />)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('calls onOpenPalette when search button is clicked', async () => {
    const onOpenPalette = vi.fn()
    const user = userEvent.setup()
    render(<TopBar {...defaultProps} onOpenPalette={onOpenPalette} />)
    await user.click(screen.getByText('Search'))
    expect(onOpenPalette).toHaveBeenCalledTimes(1)
  })

  it('calls onLogout when logout button is clicked', async () => {
    const onLogout = vi.fn()
    const user = userEvent.setup()
    render(<TopBar {...defaultProps} onLogout={onLogout} />)
    await user.click(screen.getByText('Logout'))
    expect(onLogout).toHaveBeenCalledTimes(1)
  })

  it('renders language toggle', () => {
    render(<TopBar {...defaultProps} />)
    expect(screen.getByText('EN')).toBeInTheDocument()
    expect(screen.getByText('RU')).toBeInTheDocument()
  })

  it('renders connected status badge', () => {
    render(<TopBar {...defaultProps} connectionStatus="connected" />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('renders reconnecting status badge', () => {
    render(<TopBar {...defaultProps} connectionStatus="reconnecting" />)
    expect(screen.getByText('Reconnecting')).toBeInTheDocument()
  })
})
