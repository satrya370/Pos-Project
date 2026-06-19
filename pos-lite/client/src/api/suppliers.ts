import api from './client'
import { Supplier } from '@/types'

export interface CreateSupplierInput {
  name: string
  contact?: string | null
  phone?: string | null
  address?: string | null
}

export async function getSuppliers(): Promise<Supplier[]> {
  const response = await api.get('/suppliers')
  return response.data.data
}

export async function createSupplier(data: CreateSupplierInput): Promise<Supplier> {
  const response = await api.post('/suppliers', data)
  return response.data.data
}

export async function updateSupplier(id: string, data: Partial<CreateSupplierInput>): Promise<Supplier> {
  const response = await api.put(`/suppliers/${id}`, data)
  return response.data.data
}

export async function deleteSupplier(id: string): Promise<void> {
  await api.delete(`/suppliers/${id}`)
}
