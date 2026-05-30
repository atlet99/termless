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
import { ThemeSwitch } from '../src/components/ThemeSwitch'

describe('ThemeSwitch', () => {
  it('renders with dark theme label', () => {
    render(<ThemeSwitch isDark={true} onToggle={vi.fn()} />)
    expect(screen.getByLabelText('Switch to light theme')).toBeInTheDocument()
  })

  it('renders with light theme label', () => {
    render(<ThemeSwitch isDark={false} onToggle={vi.fn()} />)
    expect(screen.getByLabelText('Switch to dark theme')).toBeInTheDocument()
  })

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()
    render(<ThemeSwitch isDark={true} onToggle={onToggle} />)
    await user.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })
})
