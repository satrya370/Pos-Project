import api from './client'
import { Transaction, CreateTransactionInput, DebtPayment } from '@/types'

export async function getTransactions(startDate?: string, endDate?: string, limit?: number): Promise<Transaction[]> {
  const params = new URLSearchParams()
  if (startDate) params.append('startDate', startDate)
  if (endDate) params.append('endDate', endDate)
  if (limit) params.append('limit', String(limit))
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

export async function getDebts(): Promise<Transaction[]> {
  const response = await api.get('/transactions/debts')
  return response.data.data
}

export async function recordDebtPayment(id: string, data: { amount: number; notes?: string | null }): Promise<DebtPayment> {
  const response = await api.post(`/transactions/${id}/pay`, data)
  return response.data.data
}
