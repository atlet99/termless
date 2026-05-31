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
import { OfflineBanner } from '../src/components/OfflineBanner'

describe('OfflineBanner', () => {
  it('renders nothing when connected', () => {
    const { container } = render(<OfflineBanner status="connected" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when degraded', () => {
    const { container } = render(<OfflineBanner status="degraded" />)
    expect(container.firstChild).toBeNull()
  })

  it('renders reconnecting message', () => {
    render(<OfflineBanner status="reconnecting" />)
    expect(screen.getByText('Reconnecting')).toBeInTheDocument()
    expect(screen.getByText('Attempting to reconnect...')).toBeInTheDocument()
  })

  it('renders offline message', () => {
    render(<OfflineBanner status="offline" />)
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByText('No connection to server')).toBeInTheDocument()
  })
})
