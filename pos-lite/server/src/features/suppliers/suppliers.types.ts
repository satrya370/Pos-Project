import { z } from 'zod'

export const createSupplierSchema = z.object({
  name:    z.string().min(1, 'Nama supplier wajib diisi'),
  contact: z.string().nullable().optional(),
  phone:   z.string().nullable().optional(),
  address: z.string().nullable().optional(),
})

export const updateSupplierSchema = createSupplierSchema.partial()

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
