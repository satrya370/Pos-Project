import { z } from 'zod'

const transactionItemSchema = z.object({
  productId:       z.string().min(1, 'Product ID wajib diisi'),
  productSizeId:   z.string().min(1, 'Product Size ID wajib diisi'),
  quantity:        z.number().int().positive('Quantity harus lebih dari 0'),
  discountPercent: z.number().min(0).max(100).default(0),
})

export const createTransactionSchema = z.object({
  items:         z.array(transactionItemSchema).min(1, 'Minimal 1 item'),
  notes:         z.string().nullable().optional(),
  customerId:    z.string().nullable().optional(),
  customerName:  z.string().nullable().optional(),
  paymentStatus: z.enum(['paid', 'credit']).default('paid'),
})

export const recordPaymentSchema = z.object({
  amount: z.number().positive('Jumlah pembayaran harus lebih dari 0'),
  notes:  z.string().nullable().optional(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>
