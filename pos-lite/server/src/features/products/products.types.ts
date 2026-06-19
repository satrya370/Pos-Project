import { z } from 'zod'

const sizeSchema = z.object({
  name:        z.string().min(1, 'Nama ukuran wajib diisi'),
  variantName: z.string().default(''),
  stock:       z.number().int().min(0).default(0),
  sku:         z.string().nullable().optional(),
})

export const createProductSchema = z.object({
  name:             z.string().min(1, 'Nama produk wajib diisi'),
  categoryId:       z.string().nullable().optional(),
  supplierId:       z.string().nullable().optional(),
  sku:              z.string().nullable().optional(),
  description:      z.string().nullable().optional(),
  purchasePrice:    z.number().min(0).default(0),
  sellingPrice:     z.number().min(0, 'Harga jual harus >= 0'),
  minStockThreshold: z.number().int().min(0).default(5),
  isBundle:         z.boolean().default(false),
  bundleProducts:   z.string().nullable().optional(),
  weight:           z.number().min(0).nullable().optional(),
  weightUnit:       z.enum(['g', 'kg', 'ml', 'L', 'pcs']).nullable().optional(),
  expiryDate:       z.string().datetime().nullable().optional(),
  variantLabel:     z.string().max(50).nullable().optional(),
  sizes: z.array(sizeSchema).optional().default([]),
})

export const updateProductSchema = createProductSchema.partial().omit({ sizes: true })

export const createSizeSchema = z.object({
  name:        z.string().min(1, 'Nama ukuran wajib diisi'),
  variantName: z.string().default(''),
  stock:       z.number().int().min(0).default(0),
  sku:         z.string().nullable().optional(),
})

export const updateSizeSchema = createSizeSchema.partial()

export const restockSizeSchema = z.object({
  quantity:      z.number().int().positive('Quantity harus lebih dari 0'),
  notes:         z.string().nullable().optional(),
  purchasePrice: z.number().min(0).nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  supplierId:    z.string().nullable().optional(),
})

export const addVariantSchema = z.object({
  variantName: z.string().min(1, 'Nama varian wajib diisi'),
})

export const addSizeNameSchema = z.object({
  sizeName: z.string().min(1, 'Nama ukuran wajib diisi'),
})

export type CreateProductInput = z.infer<typeof createProductSchema>
export type UpdateProductInput = z.infer<typeof updateProductSchema>
export type CreateSizeInput    = z.infer<typeof createSizeSchema>
export type UpdateSizeInput    = z.infer<typeof updateSizeSchema>
export type RestockSizeInput   = z.infer<typeof restockSizeSchema>
export type AddVariantInput    = z.infer<typeof addVariantSchema>
export type AddSizeNameInput   = z.infer<typeof addSizeNameSchema>
