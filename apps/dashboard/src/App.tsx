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

import { useEffect, useState } from 'react'
import { AuditLog } from './components/AuditLog'
import { ShareViewer } from './components/ShareViewer'
import { DashboardPage } from './routes/DashboardPage'
import { LoginPage } from './routes/LoginPage'
import { useAuthStore } from './stores/auth'

function getRoute(): { page: string; param?: string } {
  const hash = window.location.hash.slice(1)
  if (hash.startsWith('/view/')) return { page: 'share', param: hash.slice(6) }
  if (hash === '/admin/audit') return { page: 'audit' }
  return { page: 'dashboard' }
}

export function App() {
  const token = useAuthStore((s) => s.token)
  const hydrate = useAuthStore((s) => s.hydrate)
  const [route, setRoute] = useState(getRoute)

  useEffect(() => {
    if (token) {
      void hydrate()
    }
  }, [token, hydrate])

  useEffect(() => {
    const handler = () => {
      setRoute(getRoute())
    }
    window.addEventListener('hashchange', handler)
    return () => {
      window.removeEventListener('hashchange', handler)
    }
  }, [])

  if (route.page === 'share' && route.param) {
    return <ShareViewer shareToken={route.param} />
  }

  if (!token) {
    return <LoginPage />
  }

  if (route.page === 'audit') {
    return (
      <div className="h-screen bg-zinc-950">
        <header className="border-b border-zinc-800 px-4 py-2 flex items-center gap-4">
          <button
            type="button"
            onClick={() => {
              window.location.hash = ''
            }}
            className="text-sm text-zinc-400 hover:text-zinc-100"
          >
            Back
          </button>
          <h1 className="text-lg font-bold text-zinc-100">Termless</h1>
        </header>
        <AuditLog />
      </div>
    )
  }

  return <DashboardPage />
}
