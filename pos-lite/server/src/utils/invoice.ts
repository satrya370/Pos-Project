import { prisma } from '../lib/prisma.js'

function formatInvoiceNumber(sequence: number, date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const seq = String(sequence).padStart(3, '0')
  return `INV-${year}${month}${day}-${seq}`
}

function getTodayDateString(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function generateInvoiceNumber(): Promise<string> {
  const todayStr = getTodayDateString()
  const startOfDay = new Date(`${todayStr}T00:00:00.000Z`)
  const endOfDay = new Date(`${todayStr}T23:59:59.999Z`)

  const lastTransaction = await prisma.transaction.findFirst({
    where: {
      createdAt: { gte: startOfDay, lte: endOfDay },
    },
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  })

  let sequence = 1
  if (lastTransaction) {
    const parts = lastTransaction.invoiceNumber.split('-')
    sequence = parseInt(parts[2], 10) + 1
  }

  return formatInvoiceNumber(sequence, new Date())
}
