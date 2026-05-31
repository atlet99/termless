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
import { Sidebar } from '../src/components/Sidebar'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

describe('Sidebar', () => {
  it('renders navigation items', () => {
    render(
      <Sidebar
        active="sessions"
        onNav={vi.fn()}
        collapsed={false}
        onToggle={vi.fn()}
        onNewSession={vi.fn()}
        isAdmin={false}
      />,
    )
    expect(screen.getByText('sidebar.terminal')).toBeInTheDocument()
    expect(screen.getByText('sidebar.sessions')).toBeInTheDocument()
    expect(screen.getByText('sidebar.workspaces')).toBeInTheDocument()
  })

  it('renders new session button', () => {
    render(
      <Sidebar
        active="sessions"
        onNav={vi.fn()}
        collapsed={false}
        onToggle={vi.fn()}
        onNewSession={vi.fn()}
        isAdmin={false}
      />,
    )
    expect(screen.getByText('sidebar.newSession')).toBeInTheDocument()
  })

  it('renders admin item when isAdmin is true', () => {
    render(
      <Sidebar
        active="sessions"
        onNav={vi.fn()}
        collapsed={false}
        onToggle={vi.fn()}
        onNewSession={vi.fn()}
        isAdmin={true}
      />,
    )
    expect(screen.getByText('sidebar.admin')).toBeInTheDocument()
  })

  it('does not render admin item when isAdmin is false', () => {
    render(
      <Sidebar
        active="sessions"
        onNav={vi.fn()}
        collapsed={false}
        onToggle={vi.fn()}
        onNewSession={vi.fn()}
        isAdmin={false}
      />,
    )
    expect(screen.queryByText('sidebar.admin')).not.toBeInTheDocument()
  })

  it('calls onNav when nav item is clicked', async () => {
    const onNav = vi.fn()
    const user = userEvent.setup()
    render(
      <Sidebar
        active="sessions"
        onNav={onNav}
        collapsed={false}
        onToggle={vi.fn()}
        onNewSession={vi.fn()}
        isAdmin={false}
      />,
    )
    await user.click(screen.getByText('sidebar.terminal'))
    expect(onNav).toHaveBeenCalledWith('terminal')
  })

  it('calls onNewSession when new session button is clicked', async () => {
    const onNewSession = vi.fn()
    const user = userEvent.setup()
    render(
      <Sidebar
        active="sessions"
        onNav={vi.fn()}
        collapsed={false}
        onToggle={vi.fn()}
        onNewSession={onNewSession}
        isAdmin={false}
      />,
    )
    await user.click(screen.getByText('sidebar.newSession'))
    expect(onNewSession).toHaveBeenCalledWith('OPENCODE')
  })

  it('renders collapsed sidebar with icons only', () => {
    render(
      <Sidebar
        active="sessions"
        onNav={vi.fn()}
        collapsed={true}
        onToggle={vi.fn()}
        onNewSession={vi.fn()}
        isAdmin={false}
      />,
    )
    expect(screen.getByTitle('Expand sidebar')).toBeInTheDocument()
  })

  it('renders quick launch section', () => {
    render(
      <Sidebar
        active="sessions"
        onNav={vi.fn()}
        collapsed={false}
        onToggle={vi.fn()}
        onNewSession={vi.fn()}
        isAdmin={false}
      />,
    )
    expect(screen.getByText('sidebar.quickLaunch')).toBeInTheDocument()
    expect(screen.getByText('+ opencode')).toBeInTheDocument()
    expect(screen.getByText('+ claude')).toBeInTheDocument()
    expect(screen.getByText('+ bash')).toBeInTheDocument()
  })
})
