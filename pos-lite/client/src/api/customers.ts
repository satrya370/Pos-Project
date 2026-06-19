import api from './client'
import { Customer, Transaction } from '@/types'

export interface CreateCustomerInput {
  name: string
  phone?: string | null
  email?: string | null
  notes?: string | null
}

export interface CustomerDetail extends Customer {
  transactions: Pick<Transaction, 'id' | 'invoiceNumber' | 'totalAmount' | 'paymentStatus' | 'status' | 'createdAt' | 'itemsCount'>[]
}

export async function getCustomers(search?: string): Promise<Customer[]> {
  const params = search ? { search } : {}
  const response = await api.get('/customers', { params })
  return response.data.data
}

export async function getCustomerById(id: string): Promise<CustomerDetail> {
  const response = await api.get(`/customers/${id}`)
  return response.data.data
}

export async function createCustomer(data: CreateCustomerInput): Promise<Customer> {
  const response = await api.post('/customers', data)
  return response.data.data
}

export async function updateCustomer(id: string, data: Partial<CreateCustomerInput>): Promise<Customer> {
  const response = await api.put(`/customers/${id}`, data)
  return response.data.data
}

export async function deleteCustomer(id: string): Promise<void> {
  await api.delete(`/customers/${id}`)
}
