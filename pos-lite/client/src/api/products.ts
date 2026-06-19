import api from './client'
import { Product, CreateProductInput, UpdateProductInput, ProductSize, CreateSizeInput } from '@/types'

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

export async function uploadProductImage(id: string, file: File): Promise<Product> {
  const formData = new FormData()
  formData.append('image', file)
  const response = await api.post(`/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data.data
}

export async function deleteProductImage(id: string): Promise<Product> {
  const response = await api.delete(`/products/${id}/image`)
  return response.data.data
}

export async function getLowStockProducts(): Promise<Product[]> {
  const response = await api.get('/products/low-stock')
  return response.data.data
}

export async function getStockSummary() {
  const response = await api.get('/products/stock-summary')
  return response.data.data
}

// Size API
export async function getSizes(productId: string): Promise<ProductSize[]> {
  const response = await api.get(`/products/${productId}/sizes`)
  return response.data.data
}

export async function createSize(productId: string, data: CreateSizeInput): Promise<ProductSize> {
  const response = await api.post(`/products/${productId}/sizes`, data)
  return response.data.data
}

export async function updateSize(productId: string, sizeId: string, data: Partial<CreateSizeInput>): Promise<ProductSize> {
  const response = await api.put(`/products/${productId}/sizes/${sizeId}`, data)
  return response.data.data
}

export async function deleteSize(productId: string, sizeId: string): Promise<void> {
  await api.delete(`/products/${productId}/sizes/${sizeId}`)
}

export async function restockSize(productId: string, sizeId: string, quantity: number, notes?: string): Promise<ProductSize> {
  const response = await api.post(`/products/${productId}/sizes/${sizeId}/restock`, { quantity, notes })
  return response.data.data
}
