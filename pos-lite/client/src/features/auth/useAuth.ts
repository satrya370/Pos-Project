import { create } from 'zustand'
import { Owner } from '@/types'
import * as authApi from '@/api/auth'

interface AuthState {
  token: string | null
  owner: Owner | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  login: (email: string, password: string) => Promise<void>
  logout: () => void
  initialize: () => Promise<void>
  clearError: () => void
}

export const useAuth = create<AuthState>((set) => ({
  token: localStorage.getItem('poslite_token'),
  owner: JSON.parse(localStorage.getItem('poslite_owner') || 'null'),
  isAuthenticated: !!localStorage.getItem('poslite_token'),
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const result = await authApi.login(email, password)
      localStorage.setItem('poslite_token', result.token)
      localStorage.setItem('poslite_owner', JSON.stringify(result.owner))
      set({
        token: result.token,
        owner: result.owner,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login gagal'
      set({ error: message, isLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('poslite_token')
    localStorage.removeItem('poslite_owner')
    set({
      token: null,
      owner: null,
      isAuthenticated: false,
      error: null,
    })
  },

  initialize: async () => {
    const token = localStorage.getItem('poslite_token')
    if (!token) {
      set({ isAuthenticated: false })
      return
    }

    set({ isLoading: true })
    try {
      const owner = await authApi.getMe()
      set({
        owner,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch {
      localStorage.removeItem('poslite_token')
      localStorage.removeItem('poslite_owner')
      set({
        token: null,
        owner: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),
}))
