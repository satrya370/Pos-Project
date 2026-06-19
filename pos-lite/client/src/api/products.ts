import api from './client'
import { Product, CreateProductInput, UpdateProductInput } from '@/types'

export async function getProducts(): Promise<Product[]> {
  const response = await api.get('/products')
  return response.data.data
}

export async function getProductById(id: string): Promise<Product> {
  const response = await api.get(`/products/${id}`)
  return response.data.data
}

export async function createProduct(data: CreateProductInput): Promise<Product> {
  const response = await api.post('/products', data)
  return response.data.data
}

export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product> {
  const response = await api.put(`/products/${id}`, data)
  return response.data.data
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`)
}

export async function restockProduct(id: string, quantity: number, notes?: string): Promise<Product> {
  const response = await api.post(`/products/${id}/restock`, { quantity, notes })
  return response.data.data
}

export async function getLowStockProducts(): Promise<Product[]> {
  const response = await api.get('/products/low-stock')
  return response.data.data
}
