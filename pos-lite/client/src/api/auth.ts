import api from './client'
import { AuthResponse, Owner } from '@/types'

export async function login(email: string, password: string): Promise<AuthResponse> {
  const response = await api.post('/auth/login', { email, password })
  return response.data.data
}

export async function getMe(): Promise<Owner> {
  const response = await api.get('/auth/me')
  return response.data.data
}

export function logout(): void {
  localStorage.removeItem('poslite_token')
  localStorage.removeItem('poslite_owner')
  window.location.href = '/login'
}
