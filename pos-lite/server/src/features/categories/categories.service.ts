import { prisma } from '../../lib/prisma.js'
import { NotFoundError, BadRequestError, ConflictError } from '../../lib/errors.js'
import { CreateCategoryInput, UpdateCategoryInput } from './categories.types.js'

export async function getCategories(ownerId: string) {
  return prisma.category.findMany({
    where: { ownerId },
    orderBy: { name: 'asc' },
  })
}

export async function getCategoryById(ownerId: string, id: string) {
  const category = await prisma.category.findFirst({ where: { id, ownerId } })
  if (!category) throw new NotFoundError('Kategori tidak ditemukan')
  return category
}

export async function createCategory(ownerId: string, input: CreateCategoryInput) {
  try {
    return await prisma.category.create({
      data: { ownerId, ...input },
    })
  } catch (err: any) {
    if (err?.code === 'P2002') throw new ConflictError('Nama kategori sudah digunakan')
    throw err
  }
}

export async function updateCategory(ownerId: string, id: string, input: UpdateCategoryInput) {
  await getCategoryById(ownerId, id)
  return prisma.category.update({
    where: { id },
    data: input,
  })
}

export async function deleteCategory(ownerId: string, id: string) {
  await getCategoryById(ownerId, id)
  const related = await prisma.product.findFirst({ where: { categoryId: id } })
  if (related) throw new BadRequestError('Kategori memiliki produk terkait, tidak bisa dihapus')
  return prisma.category.delete({ where: { id } })
}
