# PosLite — Feature Expansion Implementation Plan
# ID: POS-003 | Date: 2026-06-19 | Status: Ready to Implement

## Scope

| # | Feature | Source |
|---|---------|--------|
| F1 | Supplier CRUD + Category CRUD | Tier 1 (spec unimplemented) |
| F2 | Restock Log | Tier 1 |
| F3 | Export Laporan (PDF + Excel) | Tier 1 |
| F4 | Customer CRM | Tier 2 |
| F5 | Diskon per item (%) | Tier 2 |
| F6 | Hutang / Piutang (Kasbon penuh) | Tier 3 |

**User answers:**
- Export: keduanya (PDF + Excel), user pilih format saat export
- Restock: jumlah + tanggal + harga beli + supplierId + nomor nota
- Diskon: per item (%) saja
- Kasbon: bayar penuh nanti (bukan cicilan)
- Customer di transaksi: opsional (Walk-in default)
- Kasbon untuk: siapa saja (input nama manual boleh)

---

## 1. Schema Changes

**One migration, run once:**
```
cd pos-lite/server
npx prisma migrate dev --name "feat_suppliers_customers_debts_discounts"
```

### 1.1 New model: `Customer`

```prisma
model Customer {
  id        String    @id @default(uuid())
  ownerId   String
  name      String
  phone     String?
  email     String?
  notes     String?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  owner        Owner         @relation(fields: [ownerId], references: [id])
  transactions Transaction[]

  @@unique([ownerId, phone])
  @@index([ownerId])
}
```

Add `customers Customer[]` to Owner model relations.

### 1.2 New model: `DebtPayment`

```prisma
model DebtPayment {
  id            String    @id @default(uuid())
  transactionId String
  amount        Float
  notes         String?
  paidAt        DateTime  @default(now())
  createdAt     DateTime  @default(now())

  transaction Transaction @relation(fields: [transactionId], references: [id])
}
```

### 1.3 Modify `Transaction` — add 3 fields

```prisma
customerId    String?   // FK to Customer (null = walk-in)
customerName  String?   // manual name for unregistered customers
paymentStatus String    @default("paid")  // "paid" | "credit"

// new relations
customer      Customer?     @relation(fields: [customerId], references: [id])
debtPayments  DebtPayment[]
```

### 1.4 Modify `TransactionItem` — add 2 fields

```prisma
discountPercent Float @default(0)
discountAmount  Float @default(0)
// subtotal = (unitPrice * quantity) - discountAmount (computed at write time)
```

### 1.5 Modify `StockMovement` — add 3 fields

```prisma
purchasePrice Float?
invoiceNumber String?
supplierId    String?   // loose reference, not enforced FK
```

> Note: `Supplier` and `Category` models already exist in schema. No changes needed there.

---

## 2. Phase 1: Backend

### F1A — Supplier API

**New files to create:**

`server/src/features/suppliers/suppliers.types.ts`
```typescript
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
```

`server/src/features/suppliers/suppliers.service.ts` — functions:
- `getSuppliers(ownerId)` → `findMany({ where: { ownerId }, orderBy: { name: 'asc' } })`
- `getSupplierById(ownerId, id)` → throws `NotFoundError` if not found
- `createSupplier(ownerId, input)` → throws `ConflictError` on duplicate name
- `updateSupplier(ownerId, id, input)` → validates exists first
- `deleteSupplier(ownerId, id)` → check `prisma.product.findFirst({ where: { supplierId: id } })`; throw `BadRequestError('Supplier memiliki produk terkait')` if found

`server/src/features/suppliers/suppliers.controller.ts` — standard pattern matching `products.controller.ts`

`server/src/features/suppliers/suppliers.routes.ts`
```typescript
router.use(authMiddleware)
router.get('/',    suppliersController.getSuppliers)
router.get('/:id', suppliersController.getSupplierById)
router.post('/',   validate(createSupplierSchema), suppliersController.createSupplier)
router.put('/:id', validate(updateSupplierSchema), suppliersController.updateSupplier)
router.delete('/:id', suppliersController.deleteSupplier)
```

**Modify `server/src/index.ts`** — add:
```typescript
import suppliersRoutes from './features/suppliers/suppliers.routes.js'
app.use('/api/suppliers', suppliersRoutes)
```

---

### F1B — Category API

**New files to create:**

`server/src/features/categories/categories.types.ts`
```typescript
export const createCategorySchema = z.object({
  name: z.string().min(1),
  icon: z.string().nullable().optional(),
})
export const updateCategorySchema = createCategorySchema.partial()
```

`server/src/features/categories/categories.service.ts` — functions:
- `getCategories(ownerId)` → `findMany({ where: { ownerId }, orderBy: { name: 'asc' } })`
- `getCategoryById(ownerId, id)` → throws `NotFoundError`
- `createCategory(ownerId, input)` → throws `ConflictError` on duplicate `[ownerId, name]`
- `updateCategory(ownerId, id, input)`
- `deleteCategory(ownerId, id)` → check `prisma.product.findFirst({ where: { categoryId: id } })`; throw `BadRequestError` if found

`server/src/features/categories/categories.controller.ts` — standard pattern

`server/src/features/categories/categories.routes.ts` — same CRUD pattern as suppliers

**Modify `server/src/index.ts`** — add:
```typescript
import categoriesRoutes from './features/categories/categories.routes.js'
app.use('/api/categories', categoriesRoutes)
```

---

### F2 — Restock Log API

**Modify `server/src/features/products/products.types.ts`** — update restockSizeSchema:
```typescript
export const restockSizeSchema = z.object({
  quantity:      z.number().int().positive(),
  purchasePrice: z.number().min(0).nullable().optional(),
  invoiceNumber: z.string().nullable().optional(),
  supplierId:    z.string().nullable().optional(),
  notes:         z.string().nullable().optional(),
})
```

**Modify `server/src/features/products/products.service.ts`** — update `restockSize` to pass new fields to `prisma.stockMovement.create`:
```typescript
await prisma.stockMovement.create({
  data: {
    productId,
    type: 'IN',
    quantity: input.quantity,
    notes:        input.notes ?? `Restock ${existingSize.name} ${input.quantity} unit`,
    purchasePrice: input.purchasePrice ?? null,
    invoiceNumber: input.invoiceNumber ?? null,
    supplierId:    input.supplierId ?? null,
  },
})
```

Add new function `getRestockHistory(ownerId, productId)`:
```typescript
export async function getRestockHistory(ownerId: string, productId: string) {
  const product = await prisma.product.findFirst({ where: { id: productId, ownerId } })
  if (!product) throw new NotFoundError('Produk tidak ditemukan')
  return prisma.stockMovement.findMany({
    where: { productId, type: 'IN' },
    orderBy: { createdAt: 'desc' },
  })
}
```

**Modify `server/src/features/products/products.controller.ts`** — add handler:
```typescript
export async function getRestockHistory(req, res, next) {
  try {
    const history = await productsService.getRestockHistory(req.ownerId!, req.params.id)
    res.json({ success: true, data: history })
  } catch (err) { next(err) }
}
```

**Modify `server/src/features/products/products.routes.ts`** — add before `/:id` route:
```typescript
router.get('/:id/restock-history', productsController.getRestockHistory)
```

---

### F3 — Export Laporan API

**Install dependencies:**
```
npm install pdfkit exceljs
npm install --save-dev @types/pdfkit
```

**New file: `server/src/features/reports/reports.export.service.ts`**

Functions (each returns `Buffer`):
- `generateDailyPDF(report: DailyReport): Promise<Buffer>` — use `pdfkit`, pipe to buffer collector; layout: title + date, summary table (Total Penjualan, Profit, Transaksi, Items), Top Produk table
- `generateDailyExcel(report: DailyReport): Promise<Buffer>` — use `exceljs`; Sheet1 "Ringkasan" key-value rows, Sheet2 "Top Produk" columns (Rank, Nama, Qty, Revenue)
- `generateMonthlyPDF(report: MonthlyReport): Promise<Buffer>` — same layout + weekly breakdown table
- `generateMonthlyExcel(report: MonthlyReport): Promise<Buffer>` — Sheet1 summary, Sheet2 weekly breakdown, Sheet3 top products

**Modify `server/src/features/reports/reports.routes.ts`** — add (before other routes):
```typescript
router.get('/export', reportsController.exportReport)
```

**Modify `server/src/features/reports/reports.controller.ts`** — add handler:
```typescript
export async function exportReport(req, res, next) {
  try {
    const { type, format, date, month } = req.query as Record<string, string>
    if (!['daily', 'monthly'].includes(type)) throw new BadRequestError('type harus daily atau monthly')
    if (!['pdf', 'excel'].includes(format)) throw new BadRequestError('format harus pdf atau excel')

    let buffer: Buffer, contentType: string, filename: string

    if (type === 'daily') {
      const report = await reportsService.getDailyReport(req.ownerId!, date)
      buffer = format === 'pdf'
        ? await exportService.generateDailyPDF(report)
        : await exportService.generateDailyExcel(report) as Buffer
      contentType = format === 'pdf' ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `laporan-harian-${report.date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    } else {
      const report = await reportsService.getMonthlyReport(req.ownerId!, month)
      buffer = format === 'pdf'
        ? await exportService.generateMonthlyPDF(report)
        : await exportService.generateMonthlyExcel(report) as Buffer
      contentType = format === 'pdf' ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      filename = `laporan-bulanan-${report.month}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (err) { next(err) }
}
```

---

### F4 — Customer CRM API

**New files to create:**

`server/src/features/customers/customers.types.ts`
```typescript
export const createCustomerSchema = z.object({
  name:  z.string().min(1, 'Nama customer wajib diisi'),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  notes: z.string().nullable().optional(),
})
export const updateCustomerSchema = createCustomerSchema.partial()
```

`server/src/features/customers/customers.service.ts` — functions:
- `getCustomers(ownerId, search?)` → `findMany` with optional `name: { contains: search }`
- `getCustomerById(ownerId, id)` → includes `transactions: { orderBy: { createdAt: 'desc' }, take: 20 }`
- `createCustomer(ownerId, input)` → `ConflictError` on `[ownerId, phone]` duplicate
- `updateCustomer(ownerId, id, input)`
- `deleteCustomer(ownerId, id)` → check credit transactions first; throw `BadRequestError` if any outstanding

`server/src/features/customers/customers.controller.ts` — standard pattern

`server/src/features/customers/customers.routes.ts`
```typescript
router.use(authMiddleware)
router.get('/',    customersController.getCustomers)       // ?search=xxx
router.get('/:id', customersController.getCustomerById)
router.post('/',   validate(createCustomerSchema), customersController.createCustomer)
router.put('/:id', validate(updateCustomerSchema), customersController.updateCustomer)
router.delete('/:id', customersController.deleteCustomer)
```

**Modify `server/src/index.ts`** — add:
```typescript
import customersRoutes from './features/customers/customers.routes.js'
app.use('/api/customers', customersRoutes)
```

---

### F5 — Diskon per item

**Modify `server/src/features/transactions/transactions.types.ts`** — update item schema:
```typescript
const transactionItemSchema = z.object({
  productId:       z.string().min(1),
  productSizeId:   z.string().min(1),
  quantity:        z.number().int().positive(),
  discountPercent: z.number().min(0).max(100).default(0),
})
```

**Modify `server/src/features/transactions/transactions.service.ts`** — update `buildTransactionItems` to compute discount:
```typescript
const discountAmount = (product.sellingPrice * item.quantity) * (item.discountPercent / 100)
const subtotal = product.sellingPrice * item.quantity - discountAmount
// profit = totalAmount - totalCost automatically reflects discounts
return {
  // ...existing fields
  discountPercent: item.discountPercent,
  discountAmount,
  subtotal,
}
```

---

### F6 — Hutang / Piutang

**Modify `server/src/features/transactions/transactions.types.ts`** — extend create schema:
```typescript
export const createTransactionSchema = z.object({
  items:         z.array(transactionItemSchema).min(1),
  notes:         z.string().nullable().optional(),
  customerId:    z.string().nullable().optional(),
  customerName:  z.string().nullable().optional(),
  paymentStatus: z.enum(['paid', 'credit']).default('paid'),
})

export const recordPaymentSchema = z.object({
  amount: z.number().positive(),
  notes:  z.string().nullable().optional(),
})
```

**Modify `server/src/features/transactions/transactions.service.ts`** — update `createTransaction`:
```typescript
// pass new fields to prisma.transaction.create:
customerId:    input.customerId ?? null,
customerName:  input.customerName ?? null,
paymentStatus: input.paymentStatus ?? 'paid',
```

Add new functions:
```typescript
export async function getDebts(ownerId: string) {
  return prisma.transaction.findMany({
    where: { ownerId, paymentStatus: 'credit', status: 'completed' },
    include: { items: true, debtPayments: { orderBy: { paidAt: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
}

export async function recordDebtPayment(ownerId: string, transactionId: string, input: RecordPaymentInput) {
  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, ownerId, paymentStatus: 'credit' },
    include: { debtPayments: true },
  })
  if (!transaction) throw new NotFoundError('Transaksi kredit tidak ditemukan')

  const alreadyPaid = transaction.debtPayments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = transaction.totalAmount - alreadyPaid
  if (input.amount > remaining) throw new BadRequestError(`Melebihi sisa hutang (${remaining})`)

  const payment = await prisma.debtPayment.create({
    data: { transactionId, amount: input.amount, notes: input.notes },
  })

  if (input.amount >= remaining) {
    await prisma.transaction.update({ where: { id: transactionId }, data: { paymentStatus: 'paid' } })
  }
  return payment
}
```

**Modify `server/src/features/transactions/transactions.controller.ts`** — add handlers: `getDebts`, `recordDebtPayment`

**Modify `server/src/features/transactions/transactions.routes.ts`** — add (BEFORE `/:id`):
```typescript
router.get('/debts', transactionsController.getDebts)
router.post('/:id/pay', validate(recordPaymentSchema), transactionsController.recordDebtPayment)
```

---

## 3. Phase 2: Frontend

### Types (do all at once before components)

**Modify `client/src/types/index.ts`** — add:
```typescript
export interface Supplier {
  id: string; ownerId: string; name: string
  contact?: string | null; phone?: string | null; address?: string | null; createdAt: string
}

export interface Customer {
  id: string; ownerId: string; name: string
  phone?: string | null; email?: string | null; notes?: string | null
  createdAt: string; updatedAt: string
}

export interface CustomerDetail extends Customer {
  transactions: Transaction[]
}

export interface StockMovement {
  id: string; productId: string; type: string; quantity: number
  referenceId?: string | null; notes?: string | null
  purchasePrice?: number | null; invoiceNumber?: string | null
  supplierId?: string | null; createdAt: string
}

export interface DebtPayment {
  id: string; transactionId: string; amount: number
  notes?: string | null; paidAt: string; createdAt: string
}
```

Update existing interfaces:
```typescript
// Transaction: add
customerId?:   string | null
customerName?: string | null
paymentStatus: string   // 'paid' | 'credit'
debtPayments?: DebtPayment[]

// TransactionItem: add
discountPercent: number
discountAmount:  number

// CartItem: add
discountPercent: number   // default 0
```

---

### F1 Frontend — Supplier + Category pages

**New files:**
- `client/src/api/suppliers.ts` — CRUD functions: `getSuppliers`, `createSupplier`, `updateSupplier`, `deleteSupplier`
- `client/src/api/categories.ts` — CRUD functions: `getCategories`, `createCategory`, `updateCategory`, `deleteCategory`
- `client/src/features/suppliers/SupplierForm.tsx` — modal form (name required, phone, contact, address)
- `client/src/features/suppliers/SuppliersPage.tsx` — list + create/edit modal + delete confirm
- `client/src/features/categories/CategoryForm.tsx` — modal form (name required, icon optional emoji)
- `client/src/features/categories/CategoriesPage.tsx` — same pattern as SuppliersPage

**Modify:**
- `client/src/App.tsx` — add routes `/suppliers` and `/categories`
- `client/src/components/layout/Sidebar.tsx` — add nav items (icons: `Truck` for Supplier, `Tag` for Kategori)
- `client/src/features/products/ProductForm.tsx` — add `supplierId` and `categoryId` selects (fetches from `['suppliers']` and `['categories']` queries)

---

### F2 Frontend — Restock UI

**New files:**
- `client/src/features/products/RestockModal.tsx` — fields: size selector, quantity (required), purchasePrice, invoiceNumber, supplierId (select from suppliers), notes. On submit: calls `restockSize(productId, sizeId, input)`, invalidates `['products']`
- `client/src/features/products/RestockHistoryPanel.tsx` — table: Tanggal, Ukuran, Qty, Harga Beli, No. Faktur, Supplier, Catatan. Fetches `getRestockHistory(productId)`

**Modify:**
- `client/src/api/products.ts` — update `RestockInput` type (add purchasePrice, invoiceNumber, supplierId, notes); add `getRestockHistory(productId)`
- `client/src/features/products/ProductsPage.tsx` — add "Restock" button and "Riwayat" button per row (icon: `History` from lucide)

---

### F3 Frontend — Export buttons

**Modify `client/src/api/reports.ts`** — add:
```typescript
export async function exportReport(
  type: 'daily' | 'monthly',
  format: 'pdf' | 'excel',
  params: { date?: string; month?: string }
): Promise<void> {
  const qs = new URLSearchParams({ type, format, ...params })
  const res = await api.get(`/reports/export?${qs}`, { responseType: 'blob' })
  const blob = new Blob([res.data], { type: res.headers['content-type'] })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = res.headers['content-disposition']?.split('filename=')[1]?.replace(/"/g, '')
    || `laporan.${format === 'pdf' ? 'pdf' : 'xlsx'}`
  a.click()
  URL.revokeObjectURL(url)
}
```

**Modify `client/src/features/reports/ReportsPage.tsx`** — add export button row in daily tab and monthly tab:
```tsx
<div className="flex items-center gap-2">
  <Button variant="secondary" size="sm" onClick={() => exportReport('daily', 'pdf', { date: selectedDate })}>
    <FileDown className="h-4 w-4 mr-1" /> PDF
  </Button>
  <Button variant="secondary" size="sm" onClick={() => exportReport('daily', 'excel', { date: selectedDate })}>
    <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
  </Button>
</div>
```

---

### F4 Frontend — Customer CRM

**New files:**
- `client/src/api/customers.ts` — CRUD + `getCustomers(search?)`
- `client/src/features/customers/CustomerForm.tsx` — fields: name, phone, email, notes
- `client/src/features/customers/CustomersPage.tsx` — list + search + create/edit modal + delete confirm
- `client/src/features/customers/CustomerDetailModal.tsx` — customer info + transaction history table (invoice, tanggal, total, paymentStatus badge)

**Modify:**
- `client/src/App.tsx` — add `/customers` route
- `client/src/components/layout/Sidebar.tsx` — add nav item (icon: `Users`)

---

### F5 Frontend — Diskon per item

**Modify `client/src/hooks/useCart.ts`**:
- `addItem` initializes `discountPercent: 0`
- Add `setDiscount(itemId: string, discountPercent: number)` function
- `totalPrice` = `sum(item.price * item.quantity * (1 - item.discountPercent / 100))`

**Modify `client/src/features/transactions/CartPanel.tsx`** — add per-item discount input below qty controls:
```tsx
<div className="flex items-center gap-1 mt-1">
  <span className="text-xs text-gray-500">Diskon:</span>
  <input type="number" min={0} max={100} value={item.discountPercent}
    onChange={(e) => onSetDiscount(item.id, Number(e.target.value))}
    className="w-14 text-xs px-1 py-0.5 border border-gray-300 rounded" />
  <span className="text-xs text-gray-500">%</span>
</div>
```

Update displayed item subtotal to show discounted price. Pass `discountPercent` in `createTransaction` call.

---

### F6 Frontend — Hutang / Piutang

**New files:**
- `client/src/features/debts/DebtsPage.tsx` — header "Hutang / Kasbon", summary card (total outstanding), table: Invoice, Pelanggan, Tanggal, Total, Dibayar, Sisa, Aksi. Filter toggle: Belum Lunas / Semua
- `client/src/features/debts/PayDebtModal.tsx` — shows: invoice, customer, total, sudah dibayar, sisa. Input: amount (max = remaining), notes. Submit: `recordDebtPayment(id, { amount, notes })`

**Modify:**
- `client/src/api/transactions.ts` — add `getDebts()` and `recordDebtPayment(id, data)`
- `client/src/features/transactions/CartPanel.tsx` — add "Kasbon" toggle (checkbox/switch), when enabled: show customer search combobox (queries `getCustomers`) AND plain text input for manual name. Pass `paymentStatus`, `customerId`, `customerName` to checkout
- `client/src/features/transactions/TransactionHistory.tsx` — add "Pelanggan" column; update Status badge to include orange "Kredit" for credit transactions
- `client/src/App.tsx` — add `/debts` route
- `client/src/components/layout/Sidebar.tsx` — add nav item (icon: `CreditCard`, label: `Hutang/Kasbon`)

---

## 4. Dependency Order

```
Step 1:  Schema migration (all models at once)
Step 2:  Backend F1 (Suppliers + Categories) + register routes in index.ts
Step 3:  Backend F2 (Restock Log)
Step 4:  Backend F4 (Customer CRM) + register route
Step 5:  Backend F5 (Discounts — modify transaction item schema + service)
Step 6:  Backend F6 (Kasbon — extend transaction + new debt endpoints)
Step 7:  Backend F3 (Export — install deps + new export service + controller)
Step 8:  Frontend — update types/index.ts (all additions)
Step 9:  Frontend F1 (Suppliers + Categories UI + update ProductForm selects)
Step 10: Frontend F2 (Restock Modal + History Panel + ProductsPage buttons)
Step 11: Frontend F4 (Customer pages)
Step 12: Frontend F5 + F6 (Cart discount inputs + kasbon toggle + Debts page)
Step 13: Frontend F3 (Export buttons in ReportsPage)
```

---

## 5. Testing Checklist

### Backend

**F1 Suppliers & Categories:**
- [ ] POST valid body → 201 + object
- [ ] POST duplicate name → 409
- [ ] GET list → array
- [ ] PUT → updated object
- [ ] DELETE with linked products → 400
- [ ] DELETE without linked products → 200

**F2 Restock Log:**
- [ ] POST restock with all fields → stock incremented, StockMovement row created with purchasePrice + invoiceNumber + supplierId
- [ ] GET restock-history → array of type='IN' movements

**F3 Export:**
- [ ] GET /export?type=daily&format=pdf → Content-Type: application/pdf, file download
- [ ] GET /export?type=monthly&format=excel → .xlsx content type
- [ ] Invalid type or format → 400

**F4 Customers:**
- [ ] CRUD works
- [ ] Duplicate phone → 409
- [ ] GET /:id includes transactions
- [ ] GET ?search filters by name

**F5 Discounts:**
- [ ] Transaction with discountPercent: 20 → discountAmount = unitPrice*qty*0.2, subtotal reduced, profit reflects discount
- [ ] discountPercent: 0 → no change
- [ ] discountPercent: 101 → 400 validation error

**F6 Kasbon:**
- [ ] POST transaction with paymentStatus: 'credit' + customerName → saved correctly
- [ ] GET /transactions/debts → only credit+completed
- [ ] POST /:id/pay with exact remaining amount → paymentStatus flips to 'paid'
- [ ] POST /:id/pay with amount > remaining → 400

### Frontend

- [ ] `/suppliers` CRUD works, supplier select appears in ProductForm
- [ ] `/categories` CRUD works, category select appears in ProductForm
- [ ] Restock modal sends all fields; stock count updates in product list
- [ ] Restock history modal shows table with correct data
- [ ] Reports page: PDF and Excel download buttons work for daily and monthly
- [ ] `/customers` CRUD + search + detail modal with purchase history
- [ ] POS cart shows discount % input per item; subtotal updates live
- [ ] POS checkout: kasbon toggle shows customer picker; transaction saved as credit
- [ ] `/debts` lists outstanding debts; PayDebt modal partial and full payment
- [ ] Full payment updates paymentStatus; item no longer shows in outstanding filter
- [ ] TransactionHistory shows Pelanggan column and Kredit badge
