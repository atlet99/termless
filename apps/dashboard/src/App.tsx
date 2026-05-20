import { useState } from 'react'
import { DashboardPage } from './routes/DashboardPage'
import { LoginPage } from './routes/LoginPage'
import { useAuthStore } from './stores/auth'

export function App() {
  const token = useAuthStore((s) => s.token)
  const [currentView, setCurrentView] = useState<'dashboard' | 'terminal'>('dashboard')

  if (!token) {
    return <LoginPage />
  }

  if (currentView === 'terminal') {
    return <DashboardPage onBack={() => setCurrentView('dashboard')} />
  }

  return <DashboardPage onBack={() => setCurrentView('dashboard')} />
}
