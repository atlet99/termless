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
import { StatusBadge } from '../src/components/StatusBadge'

describe('StatusBadge', () => {
  it('renders connected status', () => {
    render(<StatusBadge status="connected" />)
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('renders degraded status', () => {
    render(<StatusBadge status="degraded" />)
    expect(screen.getByText('Degraded')).toBeInTheDocument()
  })

  it('renders reconnecting status with pulse animation', () => {
    render(<StatusBadge status="reconnecting" />)
    const badge = screen.getByText('Reconnecting')
    expect(badge).toBeInTheDocument()
    const dot = badge.parentElement?.querySelector('.animate-pulse')
    expect(dot).toBeInTheDocument()
  })

  it('renders offline status', () => {
    render(<StatusBadge status="offline" />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })
})
