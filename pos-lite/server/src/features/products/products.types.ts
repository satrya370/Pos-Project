import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  categoryId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  purchasePrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0, 'Harga jual harus >= 0'),
  stock: z.number().int().min(0).default(0),
  minStockThreshold: z.number().int().min(0).default(5),
  hasVariants: z.boolean().default(false),
  variants: z.string().nullable().optional(),
  isBundle: z.boolean().default(false),
  bundleProducts: z.string().nullable().optional(),
})

export const updateProductSchema = createProductSchema.partial()

export const restockSchema = z.object({
  quantity: z.number().int().positive('Quantity harus lebih dari 0'),
  notes: z.string().nullable().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type RestockInput = z.infer<typeof restockSchema>
