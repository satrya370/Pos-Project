import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const existingOwner = await prisma.owner.findUnique({ where: { email: 'admin@poslite.com' } })
  if (existingOwner) {
    console.log('[SEED] Owner sudah ada, skip.')
    return
  }

  const passwordHash = await bcrypt.hash('password123', 10)

  const owner = await prisma.owner.create({
    data: {
      name: 'Admin PosLite',
      email: 'admin@poslite.com',
      passwordHash,
      phone: '08123456789',
    },
  })

  const categories = await Promise.all([
    prisma.category.create({ data: { ownerId: owner.id, name: 'Pakaian', icon: '👕' } }),
    prisma.category.create({ data: { ownerId: owner.id, name: 'Aksesoris', icon: '💍' } }),
    prisma.category.create({ data: { ownerId: owner.id, name: 'Lainnya', icon: '📦' } }),
  ])

  await prisma.product.createMany({
    data: [
      {
        ownerId: owner.id,
        categoryId: categories[0].id,
        name: 'Kaos Polos Putih',
        sku: 'KP-001',
        purchasePrice: 25000,
        sellingPrice: 55000,
        stock: 50,
        minStockThreshold: 10,
      },
      {
        ownerId: owner.id,
        categoryId: categories[0].id,
        name: 'Kaos Polos Hitam',
        sku: 'KP-002',
        purchasePrice: 25000,
        sellingPrice: 55000,
        stock: 40,
        minStockThreshold: 10,
      },
      {
        ownerId: owner.id,
        categoryId: categories[0].id,
        name: 'Hoodie Oversize',
        sku: 'HD-001',
        purchasePrice: 75000,
        sellingPrice: 150000,
        stock: 20,
        minStockThreshold: 5,
      },
      {
        ownerId: owner.id,
        categoryId: categories[1].id,
        name: 'Gelang Tali',
        sku: 'AK-001',
        purchasePrice: 5000,
        sellingPrice: 15000,
        stock: 100,
        minStockThreshold: 20,
      },
    ],
  })

  console.log('[SEED] Data berhasil dibuat:')
  console.log(`  - Owner: ${owner.email} / password123`)
  console.log(`  - Categories: ${categories.length}`)
  console.log(`  - Products: 4`)
}

main()
  .catch((err) => {
    console.error('[SEED] Error:', err)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
