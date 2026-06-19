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

export async function getDailyTarget(): Promise<{ dailyTarget: number }> {
  const response = await api.get('/auth/target')
  return response.data.data
}

export async function updateDailyTarget(dailyTarget: number): Promise<{ dailyTarget: number }> {
  const response = await api.put('/auth/target', { dailyTarget })
  return response.data.data
}
