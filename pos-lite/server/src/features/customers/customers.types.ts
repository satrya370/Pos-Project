import { z } from 'zod'

export const createCustomerSchema = z.object({
  name:  z.string().min(1, 'Nama customer wajib diisi'),
  phone: z.string().nullable().optional(),
  email: z.string().email('Format email tidak valid').nullable().optional(),
  notes: z.string().nullable().optional(),
})

export const updateCustomerSchema = createCustomerSchema.partial()

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
