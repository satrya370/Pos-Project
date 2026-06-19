import { z } from 'zod'

const transactionItemSchema = z.object({
  productId: z.string().min(1, 'Product ID wajib diisi'),
  quantity: z.number().int().positive('Quantity harus lebih dari 0'),
})

export const createTransactionSchema = z.object({
  items: z.array(transactionItemSchema).min(1, 'Minimal 1 item'),
  notes: z.string().nullable().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
