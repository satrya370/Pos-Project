import api from './client'
import { Transaction, CreateTransactionInput } from '@/types'

export async function getTransactions(startDate?: string, endDate?: string): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  const response = await api.get('/transactions', { params })
  return response.data.data
}

export async function getTransactionById(id: string): Promise<Transaction> {
  const response = await api.get(`/transactions/${id}`)
  return response.data.data
}

export async function createTransaction(data: CreateTransactionInput): Promise<Transaction> {
  const response = await api.post('/transactions', data)
  return response.data.data
}

export async function voidTransaction(id: string): Promise<Transaction> {
  const response = await api.put(`/transactions/${id}/void`)
  return response.data.data
}
