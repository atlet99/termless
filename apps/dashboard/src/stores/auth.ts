import { create } from 'zustand'

interface AuthUser {
  id: string
  email: string
  displayName: string | null
  role: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (token: string, user: AuthUser) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('termless_token'),
  user: null,
  setAuth: (token, user) => {
    localStorage.setItem('termless_token', token)
    set({ token, user })
  },
  logout: () => {
    localStorage.removeItem('termless_token')
    set({ token: null, user: null })
  },
}))
