# Backend Implementation Plan — PosLite

**Tanggal:** 2026-06-18  
**Status:** Siap Implementasi  
**Estimasi:** 11-14 hari (3 fase)

---

## Keputusan yang Sudah Diputuskan

| Aspek | Pilihan |
|-------|---------|
| Folder structure | Per-featured (`src/features/`) |
| Database migration | `prisma migrate dev` |
| Database dev | SQLite |
| Auth | Login only, seed data (tidak ada /register) |
| API response | `{ success: true/false, data/error }` |
| Error handling | Custom error classes (AppError, NotFoundError, dll) |
| Invoice format | `INV-YYYYMMDD-001` (reset per hari) |
| Void transaction | Ubah status + kembalikan stok |
| Stock movement | Catat semua: IN, OUT, ADJUSTMENT |
| Testing | Jest |
| AI | Skip (template-based, multi-agent nanti) |
| Cron jobs | Siapkan struktur, tidak aktif dulu |

---

## Struktur Folder Backend

```
server/src/
├── lib/
│   ├── prisma.ts
│   ├── jwt.ts
│   └── errors.ts
├── middlewares/
│   ├── auth.ts
│   └── validate.ts
├── features/
│   ├── auth/
│   ├── products/
│   ├── transactions/
│   ├── reports/
│   └── ai/                    # skeleton saja
├── utils/
│   ├── format.ts
│   └── invoice.ts
├── cron/                      # skeleton saja
│   └── scheduler.ts
└── index.ts
```

---

## Phase 1: Foundation (3-4 hari)

### 1.1 Project Setup
- TypeScript config (`tsconfig.json`)
- ESLint config
- Install dependencies: express, cors, helmet, morgan, compression, dotenv, bcryptjs, jsonwebtoken, zod, uuid
- Install dev dependencies: @types/*, tsx, jest, ts-jest, @types/jest
- Buat folder structure sesuai diagram di atas
- Script di `package.json`: `dev`, `build`, `start`, `db:generate`, `db:migrate`, `db:seed`, `test`

### 1.2 Database Schema + Migration
- Prisma schema final (8 models sesuai analisis)
- Tambah unique constraint: `@@unique([ownerId, name])` di Category dan Supplier
- Jalankan `prisma migrate dev --name init`
- Generate Prisma client

### 1.3 Seed Data
- Buat `prisma/seed.ts`
- Create 1 owner: `admin@poslite.com` / `password123`
- Create sample categories: "Pakaian", "Aksesoris", "Lainnya"
- Create 1-2 sample products untuk testing
- Jalankan via `npm run db:seed`

### 1.4 Shared Code

**`src/lib/prisma.ts`**
- Singleton PrismaClient
- Export `prisma` instance

**`src/lib/jwt.ts`**
- `signToken(ownerId: string): string` — buat JWT, expiry 7 hari
- `verifyToken(token: string): { ownerId: string }` — verifikasi JWT

**`src/lib/errors.ts`**
- `AppError` (base class, statusCode + message)
- `NotFoundError` (404)
- `UnauthorizedError` (401)
- `BadRequestError` (400)
- `ConflictError` (409)

**`src/middlewares/validate.ts`**
- `validate(schema: ZodSchema)` — return middleware yang validasi `req.body`

**`src/middlewares/auth.ts`**
- Extract JWT dari `Authorization: Bearer <token>`
- Verifikasi token, attach `ownerId` ke `req`
- Kalau tidak ada/invalid token → throw UnauthorizedError

**`src/utils/format.ts`**
- `formatCurrency(amount: number): string` — format `Rp 1.000.000`
- `formatDate(date: Date): string` — format `18 Juni 2026`

### 1.5 Auth Feature

**Endpoints:**
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login, return JWT |
| GET | `/api/auth/me` | Get current owner (protected) |
| POST | `/api/auth/logout` | Logout (client-side token removal) |

**`auth.types.ts`**
- `LoginInput = { email: string, password: string }`
- `AuthResponse = { token: string, owner: { id, name, email } }`

**`auth.service.ts`**
- `login(email, password)` — cari owner, compare password, return token
- `getMe(ownerId)` — return owner data

**`auth.controller.ts`**
- Handle request/response untuk setiap endpoint

**`auth.routes.ts`**
- POST `/login` — validate input, panggil service
- GET `/me` — auth middleware, panggil service
- POST `/logout` — return success (token dihapus di client)

### 1.6 Entry Point (`index.ts`)
- Load dotenv
- Create Express app
- Register middleware: cors, helmet, morgan, compression, express.json
- Register routes: `/api/auth/*`
- Global error handler middleware
- Start server di PORT dari env

### 1.7 Tests
- Jest config (`jest.config.ts`)
- Test auth login: valid credentials, invalid email, wrong password
- Test auth me: with valid token, without token, with invalid token

---

## Phase 2: Core POS (5-6 hari)

### 2.1 Products CRUD

**Endpoints:**
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/products` | List semua produk |
| GET | `/api/products/:id` | Detail 1 produk |
| POST | `/api/products` | Buat produk baru |
| PUT | `/api/products/:id` | Update produk |
| DELETE | `/api/products/:id` | Hapus produk |

**`products.types.ts`**
- `CreateProductInput = { name, sellingPrice, purchasePrice?, categoryId?, supplierId?, sku?, description?, stock?, minStockThreshold?, hasVariants?, variants?, isBundle?, bundleProducts? }`
- `UpdateProductInput = Partial<CreateProductInput>`

**`products.service.ts`**
- `getProducts(ownerId)` — list semua produk
- `getProductById(ownerId, productId)` — detail 1 produk
- `createProduct(ownerId, input)` — buat produk baru
- `updateProduct(ownerId, productId, input)` — update produk
- `deleteProduct(ownerId, productId)` — hapus produk

### 2.2 Products Extras

**Endpoints:**
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/products/:id/restock` | Tambah stok |
| GET | `/api/products/low-stock` | Produk dengan stok < threshold |

**`products.service.ts` (lanjutan)**
- `restock(productId, quantity, notes?)` — tambah stok + create StockMovement IN
- `getLowStockProducts(ownerId)` — query `WHERE stock < minStockThreshold`

### 2.3 Stock Tracking
- Setiap kali stok berubah (restock, transaksi, void), create record `StockMovement`
- Type: `"IN"` (restock), `"OUT"` (transaksi), `"ADJUSTMENT"` (manual)
- Field: `productId, type, quantity, referenceId (transactionId atau null), notes`

### 2.4 Transactions

**Endpoints:**
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/transactions` | List transaksi |
| GET | `/api/transactions/:id` | Detail transaksi + items |
| POST | `/api/transactions` | Buat transaksi baru (checkout) |
| PUT | `/api/transactions/:id/void` | Void transaksi |

**`transactions.types.ts`**
- `CreateTransactionInput = { items: Array<{ productId, quantity, variant? }>, notes? }`
- `TransactionItem = { productId, productName, variant?, quantity, unitPrice, costAtPurchase, subtotal }`

**`transactions.service.ts`**
- `getTransactions(ownerId, filters?)` — list transaksi, filter by date
- `getTransactionById(ownerId, transactionId)` — detail + items
- `createTransaction(ownerId, input)` — checkout:
  1. Validasi semua produk ada dan stok cukup
  2. Hitung totalAmount, totalCost, profit
  3. Generate invoiceNumber (`INV-YYYYMMDD-001`)
  4. Create Transaction + TransactionItems
  5. Kurangi stok produk
  6. Create StockMovement OUT untuk setiap item
- `voidTransaction(ownerId, transactionId)`:
  1. Cari transaksi, pastikan status "completed"
  2. Ubah status ke "voided"
  3. Kembalikan stok setiap item
  4. Create StockMovement IN untuk setiap item

### 2.5 Invoice Generation

**`src/utils/invoice.ts`**
- `generateInvoiceNumber(): Promise<string>`
- Query transaksi terakhir hari ini
- Format: `INV-YYYYMMDD-XXX` (XXX = sequence, reset setiap hari)
- Kalau belum ada transaksi hari ini → `INV-20260618-001`
- Kalau sudah ada → increment: `INV-20260618-002`

### 2.6 Reports

**Endpoints:**
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/reports/daily` | Laporan harian (query: ?date=YYYY-MM-DD) |
| GET | `/api/reports/weekly` | Laporan mingguan (query: ?week=YYYY-WXX) |
| GET | `/api/reports/monthly` | Laporan bulanan (query: ?month=YYYY-MM) |
| GET | `/api/reports/top-products` | Produk terlaris & terburuk |

**`reports.types.ts`**
- `DailyReport = { date, totalSales, totalCost, profit, transactionsCount, itemsSold, topProducts }`
- `WeeklyReport = { week, dailyBreakdown[], totalSales, totalProfit }`
- `MonthlyReport = { month, weeklyBreakdown[], totalSales, totalProfit }`
- `TopProducts = { top: ProductRank[], bottom: ProductRank[] }`

**`reports.service.ts`**
- `getDailyReport(ownerId, date)` — aggregate transaksi 1 hari
- `getWeeklyReport(ownerId, week)` — aggregate 7 hari
- `getMonthlyReport(ownerId, month)` — aggregate 1 bulan
- `getTopProducts(ownerId, period?)` — ranking berdasarkan quantity terjual

### 2.7 Register Routes ke Entry Point
- Tambahkan routes: `/api/products/*`, `/api/transactions/*`, `/api/reports/*`
- Update `index.ts`

### 2.8 Tests
- Products: create, update, delete, restock, low-stock
- Transactions: create (stok cukup), create (stok kurus - fail), void
- Reports: daily, weekly, monthly, top-products

---

## Phase 3: Enhancement (3-4 hari)

### 3.1 Product Import
- `POST /api/products/import` — upload Excel (.xlsx)
- Parse file dengan `xlsx` library
- Bulk create products

### 3.2 Dashboard API
- `GET /api/dashboard/summary` — total hari ini, minggu ini, bulan ini

### 3.3 Swagger UI
- Install `swagger-jsdoc` + `swagger-ui-express`
- Dokumentasikan semua endpoints

### 3.4 Cron Job Skeleton
- Folder `src/cron/` + `scheduler.ts`
- Siapkan schedule configuration (tidak aktif)

### 3.5 Report Comparison
- `GET /api/reports/comparison` — bandingkan 2 periode

### 3.6 Final Testing + Cleanup
- Pastikan semua test pass
- Hapus console.log
- Code review

---

## API Endpoints Summary

### Auth (Phase 1)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Get current user |
| POST | `/api/auth/logout` | Yes | Logout |

### Products (Phase 2)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/products` | Yes | List products |
| GET | `/api/products/:id` | Yes | Get product |
| POST | `/api/products` | Yes | Create product |
| PUT | `/api/products/:id` | Yes | Update product |
| DELETE | `/api/products/:id` | Yes | Delete product |
| POST | `/api/products/:id/restock` | Yes | Restock product |
| GET | `/api/products/low-stock` | Yes | Low stock products |

### Transactions (Phase 2)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/transactions` | Yes | List transactions |
| GET | `/api/transactions/:id` | Yes | Get transaction |
| POST | `/api/transactions` | Yes | Create transaction |
| PUT | `/api/transactions/:id/void` | Yes | Void transaction |

### Reports (Phase 2)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reports/daily` | Yes | Daily report |
| GET | `/api/reports/weekly` | Yes | Weekly report |
| GET | `/api/reports/monthly` | Yes | Monthly report |
| GET | `/api/reports/top-products` | Yes | Top/bottom products |

### Enhancement (Phase 3)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/products/import` | Yes | Import from Excel |
| GET | `/api/dashboard/summary` | Yes | Dashboard summary |
| GET | `/api/reports/comparison` | Yes | Compare periods |

---

## Test Cases

### Auth
- Login dengan email benar + password benar → 200 + token
- Login dengan email benar + password salah → 401
- Login dengan email tidak ada → 401
- GET /me dengan token valid → 200 + owner data
- GET /me tanpa token → 401
- GET /me dengan token invalid → 401

### Products
- Create produk → 200 + produk
- Create produk tanpa name → 400
- Get produk yang tidak ada → 404
- Update produk → 200 + produk updated
- Delete produk → 200
- Delete produk yang punya transaksi → 400 ( atau cascade delete)
- Restock → stok bertambah + StockMovement IN tercatat
- Low stock → return produk dengan stok < threshold

### Transactions
- Checkout stok cukup → 200 + transaksi, stok berkurang, StockMovement OUT tercatat
- Checkout stok kurus → 400
- Checkout produk tidak ada → 404
- Void transaksi → 200, status "voided", stok kembali, StockMovement IN tercatat
- Void transaksi yang sudah voided → 400
- Get transaksi tidak ada → 404

### Reports
- Daily report → 200 + data aggregate
- Weekly report → 200 + data aggregate
- Monthly report → 200 + data aggregate
- Top products → 200 + ranking

---

## Notes

- AI pipeline dan cron jobs: siapkan struktur folder, tidak implement dulu
- Product import dari Excel: ada di Phase 3
- Swagger UI: ada di Phase 3
- Deploy: belum dibahas (akan dibahas setelah backend selesai)
