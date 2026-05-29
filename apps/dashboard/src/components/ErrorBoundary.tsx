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

import { type ReactNode, Component } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex h-screen items-center justify-center bg-zinc-950">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-red-400">Something went wrong</h1>
            <p className="mt-2 text-zinc-400">{this.state.error?.message}</p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null })
              }}
              className="mt-4 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-500"
            >
              Try again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
