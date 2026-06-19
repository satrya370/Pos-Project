import api from './client'
import { Category } from '@/types'

export interface CreateCategoryInput {
  name: string
  icon?: string | null
}

export async function getCategories(): Promise<Category[]> {
  const response = await api.get('/categories')
  return response.data.data
}

export async function createCategory(data: CreateCategoryInput): Promise<Category> {
  const response = await api.post('/categories', data)
  return response.data.data
}

export async function updateCategory(id: string, data: Partial<CreateCategoryInput>): Promise<Category> {
  const response = await api.put(`/categories/${id}`, data)
  return response.data.data
}

export async function deleteCategory(id: string): Promise<void> {
  await api.delete(`/categories/${id}`)
}
