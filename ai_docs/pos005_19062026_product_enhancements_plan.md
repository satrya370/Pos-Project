# PosLite — Product Enhancements Implementation Plan
# ID: POS-005 | Date: 2026-06-19 | Status: Ready to Implement

## Scope

| # | Feature | Deskripsi |
|---|---------|-----------|
| E1 | Berat Produk | Field weight + unit (g/kg/ml/L/pcs) di Product |
| E2 | Tanggal Kadaluarsa | Field expiryDate di Product, badge warna di listing |
| E3 | Notifikasi Kadaluarsa | Alert card di Dashboard + disable di cart |
| E4 | Out of Stock Indicator | Badge "Habis" di ProductsPage + disable di cart |
| E5 | Varian Produk | Dimensi varian bebas (corak, rasa, warna) × ukuran existing |

**Keputusan desain:**
- Expiry level **Product** (bukan per-batch)
- Weight = `Float + unit String`
- OOS = semua combo sizes.stock = 0
- Expiry threshold: Expired (merah) / ≤7H (rose) / 8–30H (kuning) / >30H (hijau subtle)
- Varian: **Opsi A** — extend `ProductSize` dengan field `variantName String @default("")`
- Varian + Ukuran = keduanya opsional, bisa dipakai salah satu atau keduanya
- Menambah ukuran baru → buat 1 entry per varian yang ada (atau 1 entry jika tidak ada varian)
- Menambah varian baru → buat 1 entry per ukuran yang ada (atau 1 entry jika tidak ada ukuran)
- Menghapus ukuran "M" → hapus SEMUA ProductSize entry dengan name="M" untuk produk itu
- Menghapus varian "Corak Singa" → hapus SEMUA entry dengan variantName="Corak Singa"
- Report sudah otomatis beda per combo karena pakai `productSizeId` di TransactionItem

---

## Schema Changes (semua di Phase 1)

### `Product` — tambah 3 field baru + 1 field varian

```prisma
model Product {
  ...existing fields...
  weight       Float?    // nilai numerik, null = tidak diset
  weightUnit   String?   // "g" | "kg" | "ml" | "L" | "pcs"
  expiryDate   DateTime? // null = tidak ada kadaluarsa
  variantLabel String?   // label dimensi varian, mis. "Warna", "Corak", "Rasa"
                         // null = tidak pakai varian
}
```

### `ProductSize` — tambah variantName + ubah unique constraint

```prisma
model ProductSize {
  id        String  @id @default(uuid())
  productId String
  name      String          // ukuran: "S", "M", "XL", "Default"
  variantName String @default("") // varian: "Corak Singa", "Ayam", "" = tidak ada varian
  stock     Int     @default(0)
  sku       String?

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, name, variantName])  // ganti dari @@unique([productId, name])
}
```

**Migrasi**: `npx prisma db push` — backward compatible karena `variantName` default `""`.
Existing data: `name="S", variantName=""` → tetap valid dan unique.

---

## Phase 1: Schema + Backend

### 1.1 Schema
Terapkan perubahan di atas ke `prisma/schema.prisma`, lalu `npx prisma db push`.

### 1.2 Backend — `products.types.ts`

Tambah ke createProductSchema / updateProductSchema:
```typescript
weight:       z.number().min(0).nullable().optional(),
weightUnit:   z.enum(['g', 'kg', 'ml', 'L', 'pcs']).nullable().optional(),
expiryDate:   z.string().datetime().nullable().optional(),
variantLabel: z.string().max(50).nullable().optional(),
```

Update size schema (untuk createProduct / addSize):
```typescript
const sizeSchema = z.object({
  name:        z.string().min(1),
  variantName: z.string().default(''),
  stock:       z.number().int().min(0).default(0),
  sku:         z.string().nullable().optional(),
})
```

Tambah schema baru untuk operasi varian:
```typescript
export const addVariantSchema = z.object({
  variantName: z.string().min(1, 'Nama varian wajib diisi'),
})
export const addSizeNameSchema = z.object({
  sizeName: z.string().min(1, 'Nama ukuran wajib diisi'),
})
```

### 1.3 Backend — `products.service.ts`

Update `createProduct` dan `updateProduct` — pass field baru:
```typescript
data: {
  ...existing,
  weight:       input.weight ?? null,
  weightUnit:   input.weightUnit ?? null,
  expiryDate:   input.expiryDate ? new Date(input.expiryDate) : null,
  variantLabel: input.variantLabel ?? null,
}
```

Update size creation: `sizes` input sekarang include `variantName`:
```typescript
// Saat createProduct, untuk setiap size di input.sizes:
prisma.productSize.create({
  data: { productId, name: s.name, variantName: s.variantName ?? '', stock: s.stock, sku: s.sku }
})
```

**Fungsi baru: `addVariant(ownerId, productId, variantName)`**
```typescript
// 1. Ambil semua unique size names dari ProductSize produk ini
// 2. Untuk setiap size name, buat ProductSize baru dengan variantName yang diberikan
// 3. Jika tidak ada size name sama sekali (produk baru): buat 1 entry { name: 'Default', variantName }
// 4. Return list ProductSize yang baru dibuat
```

**Fungsi baru: `addSizeName(ownerId, productId, sizeName)`**
```typescript
// 1. Ambil semua unique variantNames dari ProductSize produk ini
// 2. Untuk setiap variantName, buat ProductSize baru dengan sizeName yang diberikan
// 3. Jika tidak ada variant: buat 1 entry { name: sizeName, variantName: '' }
```

**Fungsi baru: `deleteVariant(ownerId, productId, variantName)`**
```typescript
// deleteMany: WHERE productId = X AND variantName = Y
// Blokir jika ada TransactionItem terkait (integritas data)
// Return jumlah entry yang dihapus
```

**Fungsi baru: `deleteSizeName(ownerId, productId, sizeName)`**
```typescript
// deleteMany: WHERE productId = X AND name = Y
// Blokir jika ada TransactionItem terkait
```

**Fungsi baru: `getExpiringProducts(ownerId, withinDays)`** (seperti plan lama)

### 1.4 Backend — `products.controller.ts`

Tambah handlers:
- `addVariant` — POST /products/:id/variants
- `deleteVariant` — DELETE /products/:id/variants/:variantName
- `addSizeName` — POST /products/:id/size-names
- `deleteSizeName` — DELETE /products/:id/size-names/:sizeName
- `getExpiring` — GET /products/expiring

### 1.5 Backend — `products.routes.ts`

Tambah routes **SEBELUM** `/:id`:
```typescript
router.get('/expiring', productsController.getExpiring)
router.post('/:id/variants', productsController.addVariant)
router.delete('/:id/variants/:variantName', productsController.deleteVariant)
router.post('/:id/size-names', productsController.addSizeName)
router.delete('/:id/size-names/:sizeName', productsController.deleteSizeName)
```

---

## Phase 2: ProductForm + ProductsPage

### 2.1 Frontend — `types/index.ts`

Update `Product`:
```typescript
weight?:       number | null
weightUnit?:   'g' | 'kg' | 'ml' | 'L' | 'pcs' | null
expiryDate?:   string | null
variantLabel?: string | null
```

Update `ProductSize`:
```typescript
variantName: string   // "" = tidak ada varian
```

### 2.2 Frontend — `api/products.ts`

Tambah:
```typescript
export async function addVariant(productId: string, variantName: string): Promise<ProductSize[]>
export async function deleteVariant(productId: string, variantName: string): Promise<void>
export async function addSizeName(productId: string, sizeName: string): Promise<ProductSize[]>
export async function deleteSizeName(productId: string, sizeName: string): Promise<void>
export async function getExpiringProducts(withinDays?: number): Promise<Product[]>
```

### 2.3 Frontend — `ProductForm.tsx` (revisi besar)

#### Field baru: Berat + Kadaluarsa + Label Varian
Tambah di bawah field existing (sebelum bagian Sizes):
```tsx
// Berat: 2 input inline — angka (weight) + select unit (g/kg/ml/L/pcs)
// Kadaluarsa: input type="date", hint "Kosongkan jika tidak ada kadaluarsa"
// Label Varian: input text, placeholder "Corak, Warna, Rasa..." hint "Label dimensi varian (opsional)"
```

#### Revisi seksi "Ukuran & Varian" — ganti seksi Sizes lama

Saat ini ada tabel sizes. Revisi menjadi **2 bagian terpisah**:

**Bagian A — Kelola Ukuran:**
```tsx
// Chips: setiap unique size name yang ada di product.sizes
// + button "Tambah Ukuran" → input text inline → panggil addSizeName mutation
// × pada chip → konfirmasi → panggil deleteSizeName mutation
// Contoh chips: [S ×] [M ×] [L ×] [+ Tambah Ukuran]
```

**Bagian B — Kelola Varian** (hanya muncul jika variantLabel diisi):
```tsx
// Chips: setiap unique variantName yang ada di product.sizes (filter "" keluar)
// + button "Tambah Varian" → input text inline → panggil addVariant mutation
// × pada chip → konfirmasi → panggil deleteVariant mutation
// Contoh chips: [Corak Singa ×] [Corak Buaya ×] [+ Tambah Varian]
```

**Bagian C — Grid Kombinasi** (hanya muncul jika ada keduanya):
```tsx
// Tabel kecil readonly untuk preview:
// Baris = ukuran, Kolom = varian
// Tiap sel: stok (dari sizes yang match name + variantName)
// Ini hanya display — edit stok tetap lewat Restock modal
//
// Contoh:
//        Corak Singa   Corak Buaya
// S          5              3
// M          0              7  ← badge "Habis"
// L          2              1
```

**Bagian D — Individual sizes** (untuk produk tanpa kombinasi):
```tsx
// Tetap tampilkan tabel sizes individual untuk edit SKU, seperti sekarang
// Hanya tampil jika tidak ada variantLabel (produk sederhana)
```

### 2.4 Frontend — `ProductsPage.tsx`

#### Kolom tabel — revisi grid

Kolom baru yang ditambahkan:
| Kolom | Isi |
|-------|-----|
| Varian | Chips kecil per unique variantName, atau "-" |
| Ukuran | Jumlah ukuran: "3 ukuran" atau nama jika hanya 1 |
| Stok | Total stok semua combo + badge OOS |
| Berat | "{weight} {unit}" atau "-" |
| Kadaluarsa | ExpiryBadge |

#### Helper `getExpiryStatus` + komponen `ExpiryBadge`
(sama seperti plan lama — see Implementation Notes)

#### Filter bar
```tsx
// Search (existing) + dropdown filter:
// "Semua" | "Hampir Kadaluarsa" | "Kadaluarsa" | "Stok Habis"
// Client-side filter
```

#### Badge OOS
```tsx
// Jika semua sizes.stock === 0 → Badge merah "Habis"
// Jika sebagian → Badge kuning "Sebagian Habis"
```

---

## Phase 3: RecordSalePage + Dashboard

### 3.1 Frontend — `RecordSalePage.tsx` — Variant+Size selector

Saat ini: klik produk → pilih ukuran → tambah ke cart.

Dengan varian:
```tsx
// Jika produk punya variantLabel:
//   Step 1 → pilih varian (chips/dropdown dari unique variantNames)
//   Step 2 → pilih ukuran yang tersedia untuk varian itu
//   Hanya tampilkan size chips yang stoknya > 0 untuk varian terpilih
//
// Jika produk hanya ukuran (tidak ada variantLabel):
//   → Perilaku sama seperti sekarang
//
// Jika produk hanya varian (tidak ada sizes selain Default):
//   → Pilih varian langsung (tanpa step ukuran)
//
// Jika tidak keduanya: → Langsung tambah (Default)
```

Display di CartItem: `{variantName ? variantName + ' / ' : ''}{name !== 'Default' ? name : ''}`

OOS: tombol "Tambah" disabled jika stok combo = 0.
Kadaluarsa: disabled + badge merah jika `product.expiryDate` sudah lewat.

### 3.2 Frontend — `DashboardPage.tsx` — Expiry Alert Card

```tsx
// useQuery(['products', 'expiring'], () => getExpiringProducts(30))
// Tampil jika ada data, tersembunyi jika tidak ada
// Card merah: X produk SUDAH kadaluarsa
// Card kuning: X produk hampir kadaluarsa (≤30 hari)
// Link → /products?filter=expiry
```

---

## File Checklist

### Phase 1 — Backend + Schema
- [ ] `prisma/schema.prisma` — weight, weightUnit, expiryDate, variantLabel ke Product; variantName ke ProductSize; ubah @@unique
- [ ] `npx prisma db push`
- [ ] `products.types.ts` — update schemas
- [ ] `products.service.ts` — pass fields baru + 5 fungsi baru (addVariant, deleteVariant, addSizeName, deleteSizeName, getExpiringProducts)
- [ ] `products.controller.ts` — 5 handler baru + getExpiring
- [ ] `products.routes.ts` — 5 route baru sebelum /:id

### Phase 2 — Product UI
- [ ] `types/index.ts` — update Product + ProductSize interface
- [ ] `api/products.ts` — 5 fungsi baru
- [ ] `ProductForm.tsx` — field baru + revisi seksi Ukuran & Varian (4 bagian: chip ukuran, chip varian, grid preview, individual table)
- [ ] `ProductsPage.tsx` — revisi kolom tabel, ExpiryBadge, OOS badge, filter dropdown

### Phase 3 — Cart + Dashboard
- [ ] `RecordSalePage.tsx` — variant+size selector 2-step, OOS+expired disable
- [ ] `DashboardPage.tsx` — ExpiryAlertCard

---

## Implementation Notes

### variantName di cart display
```typescript
function getSizeLabel(size: ProductSize): string {
  const parts = []
  if (size.variantName) parts.push(size.variantName)
  if (size.name !== 'Default') parts.push(size.name)
  return parts.join(' / ') || 'Default'
}
// "Corak Singa / M", "Ayam", "L", "Default"
```

### Unique sizes & variants dari product.sizes
```typescript
const uniqueSizes    = [...new Set(sizes.map(s => s.name).filter(n => n !== 'Default'))]
const uniqueVariants = [...new Set(sizes.map(s => s.variantName).filter(v => v !== ''))]
const hasVariants    = uniqueVariants.length > 0
const hasSizes       = uniqueSizes.length > 0
```

### Delete safety — blokir jika ada transaksi
```typescript
// Sebelum deleteMany ProductSize, cek:
const txCount = await prisma.transactionItem.count({
  where: { productSizeId: { in: sizeIdsToDelete } }
})
if (txCount > 0) throw new ConflictError(
  `Tidak bisa hapus — ada ${txCount} transaksi terkait`
)
```

### Expiry threshold
| Status | Kondisi | Warna |
|--------|---------|-------|
| `expired` | Sudah lewat | Merah `red` |
| `soon` | ≤ 7 hari | Rose `rose` |
| `warning` | 8–30 hari | Kuning `yellow` |
| `ok` | > 30 hari | Hijau subtle `green` |
| `none` | Tidak ada expiry | Abu `-` |

### Weight units
`g` · `kg` · `ml` · `L` · `pcs`

### Backward compatibility
- Semua existing ProductSize: `variantName = ""` (default) → tidak ada perubahan tampilan
- Unique constraint lama `[productId, name]` → baru `[productId, name, variantName]`
  - `("S", "")` tetap unique → existing data aman
- `prisma db push` tanpa migration file — cocok untuk SQLite dev

---

## Estimasi Effort

| Phase | Backend | Frontend | Total |
|-------|---------|----------|-------|
| 1 | Schema + 5 fungsi + 5 route | - | Sedang |
| 2 | - | ProductForm revisi besar + ProductsPage kolom | Besar |
| 3 | - | RecordSalePage 2-step selector + Dashboard alert | Sedang |
