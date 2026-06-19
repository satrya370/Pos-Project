import { z } from 'zod'

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nama produk wajib diisi'),
  categoryId: z.string().nullable().optional(),
  supplierId: z.string().nullable().optional(),
  sku: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  purchasePrice: z.number().min(0).default(0),
  sellingPrice: z.number().min(0, 'Harga jual harus >= 0'),
  minStockThreshold: z.number().int().min(0).default(5),
  isBundle: z.boolean().default(false),
  bundleProducts: z.string().nullable().optional(),
  sizes: z.array(z.object({
    name: z.string().min(1, 'Nama ukuran wajib diisi'),
    stock: z.number().int().min(0).default(0),
    sku: z.string().nullable().optional(),
  })).optional().default([]),
})

export const updateProductSchema = createProductSchema.partial().omit({ sizes: true })

export const createSizeSchema = z.object({
  name: z.string().min(1, 'Nama ukuran wajib diisi'),
  stock: z.number().int().min(0).default(0),
  sku: z.string().nullable().optional(),
})

export const updateSizeSchema = createSizeSchema.partial()

export const restockSizeSchema = z.object({
  quantity:      z.number().int().positive('Quantity harus lebih dari 0'),
  notes:         z.string().nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  supplierId:    z.string().nullable().optional(),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateSizeInput = z.infer<typeof createSizeSchema>
export type UpdateSizeInput = z.infer<typeof updateSizeSchema>
export type RestockSizeInput = z.infer<typeof restockSizeSchema>
