# PosLite — Product Enhancements Implementation Plan
# ID: POS-005 | Date: 2026-06-19 | Status: Ready to Implement

## Scope

| # | Feature | Deskripsi |
|---|---------|-----------|
| E1 | Berat Produk | Field weight + unit (g/kg/ml/L) di Product |
| E2 | Tanggal Kadaluarsa | Field expiryDate di Product, ditampilkan di listing |
| E3 | Notifikasi Kadaluarsa | Badge warna di ProductsPage + alert card di Dashboard |
| E4 | Out of Stock Indicator | Badge "Habis" di ProductsPage + disable di cart |

**Keputusan desain:**
- Expiry date level **Product** (bukan per-batch/StockMovement) — cukup untuk POS kecil-menengah
- Weight sebagai `Float + unit String` (bukan free text) agar bisa diurutkan/difilter
- OOS = semua varian/sizes stock = 0 (sudah bisa dihitung dari data existing, tidak butuh field baru)
- Expiry threshold: **Expired** (merah), **≤ 7 hari** (merah muda), **8–30 hari** (kuning), **> 30 hari** (normal)
- Dashboard: satu alert card "Produk Kadaluarsa / Hampir Kadaluarsa" jika ada yang perlu perhatian

---

## Phase 1: Schema + Backend

### 1.1 Schema Changes — `prisma/schema.prisma`

Tambah 3 field ke model `Product`:

```prisma
model Product {
  ...existing fields...
  weight      Float?          // nilai numerik, null = tidak diset
  weightUnit  String?         // "g" | "kg" | "ml" | "L" | "pcs"
  expiryDate  DateTime?       // null = produk tanpa kadaluarsa
  ...relations...
}
```

Jalankan:
```bash
cd pos-lite/server && npx prisma db push
```

Tidak ada breaking change — semua field nullable/optional.

### 1.2 Backend — `products.types.ts`

Update `createProductSchema` dan `updateProductSchema`:

```typescript
// Tambah ke createProductSchema
weight:     z.number().min(0).nullable().optional(),
weightUnit: z.enum(['g', 'kg', 'ml', 'L', 'pcs']).nullable().optional(),
expiryDate: z.string().datetime().nullable().optional(),
// datetime string dari frontend (ISO 8601), di-parse ke Date di service
```

### 1.3 Backend — `products.service.ts`

Update `createProduct` dan `updateProduct` agar pass field baru ke Prisma:
```typescript
data: {
  ...existing fields...
  weight:     input.weight ?? null,
  weightUnit: input.weightUnit ?? null,
  expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
}
```

### 1.4 Backend — Endpoint baru: `GET /products/expiring`

Tambah ke `products.service.ts`:
```typescript
export async function getExpiringProducts(ownerId: string, withinDays = 30) {
  const threshold = new Date()
  threshold.setDate(threshold.getDate() + withinDays)

  return prisma.product.findMany({
    where: {
      ownerId,
      expiryDate: { not: null, lte: threshold },
    },
    include: { sizes: true, category: true },
    orderBy: { expiryDate: 'asc' },
  })
}
```

Tambah ke `products.controller.ts`:
```typescript
getExpiring: async (req, res, next) => {
  const days = parseInt(req.query.days as string) || 30
  const products = await productsService.getExpiringProducts(req.owner!.id, days)
  res.json({ success: true, data: products })
}
```

Tambah ke `products.routes.ts` — **SEBELUM `/:id`**:
```typescript
router.get('/expiring', productsController.getExpiring)
```

---

## Phase 2: Product Form + Listing UI

### 2.1 Frontend — `types/index.ts`

Update interface `Product`:
```typescript
export interface Product {
  ...existing fields...
  weight?: number | null
  weightUnit?: 'g' | 'kg' | 'ml' | 'L' | 'pcs' | null
  expiryDate?: string | null   // ISO string dari API
}
```

### 2.2 Frontend — `api/products.ts`

Tambah:
```typescript
export async function getExpiringProducts(withinDays = 30): Promise<Product[]> {
  const response = await api.get('/products/expiring', { params: { days: withinDays } })
  return response.data.data
}
```

### 2.3 Frontend — `ProductForm.tsx`

Tambah 2 section baru sebelum tombol submit:

#### Section: Berat
```tsx
// Row dengan 2 input: angka (weight) + select (weightUnit)
// Label: "Berat Produk (opsional)"
// Input number, placeholder "500"
// Select: g | kg | ml | L | pcs
// Default unit: g
```

#### Section: Tanggal Kadaluarsa
```tsx
// Input type="date" untuk expiryDate
// Label: "Tanggal Kadaluarsa (opsional)"
// Hint: "Kosongkan jika produk tidak memiliki tanggal kadaluarsa"
// Konversi: value date input ke ISO string saat submit
```

Update `defaultValues` dan `reset()` di useEffect:
```typescript
weight: product.weight ?? null,
weightUnit: product.weightUnit ?? 'g',
expiryDate: product.expiryDate
  ? new Date(product.expiryDate).toISOString().split('T')[0]  // format YYYY-MM-DD
  : '',
```

### 2.4 Frontend — `ProductsPage.tsx`

#### Kolom baru di tabel: Berat + Kadaluarsa

```tsx
// Kolom Berat: "{weight} {weightUnit}" atau "-" jika null
// Kolom Kadaluarsa: ExpiryBadge component (lihat bawah)
```

#### Helper function `getExpiryStatus(expiryDate: string | null | undefined)`

```typescript
type ExpiryStatus = 'none' | 'ok' | 'warning' | 'soon' | 'expired'

function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return 'none'
  const now = new Date()
  const expiry = new Date(expiryDate)
  const daysUntil = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (daysUntil < 0)  return 'expired'    // sudah lewat
  if (daysUntil <= 7) return 'soon'       // ≤ 7 hari
  if (daysUntil <= 30) return 'warning'   // 8–30 hari
  return 'ok'                              // > 30 hari
}
```

#### Komponen `ExpiryBadge`

```tsx
// 'none'    → "-" (teks abu, tidak ada badge)
// 'ok'      → tanggal saja, teks hijau kecil
// 'warning' → badge kuning "30 Hari" + tanggal
// 'soon'    → badge merah muda "7 Hari!" + tanggal
// 'expired' → badge merah "Kadaluarsa!" + tanggal
```

#### Filter tambahan di ProductsPage

Tambah ke filter bar yang sudah ada (di samping search):
```tsx
// Dropdown/toggle filter: "Semua" | "Hampir Kadaluarsa" | "Kadaluarsa" | "Stok Habis"
// Filter dilakukan di frontend (client-side) dari data products yang sudah di-fetch
// Tidak perlu endpoint baru
```

#### Out of Stock Badge

```tsx
// Di kolom Stok atau nama produk:
// Jika semua sizes.every(s => s.stock === 0) → Badge merah "Habis"
// Jika beberapa sizes stock = 0 tapi tidak semua → Badge kuning "Sebagian Habis"
```

---

## Phase 3: Dashboard Alerts + Cart Integration

### 3.1 Frontend — Dashboard Alert Card

Tambah di `DashboardPage.tsx` (di bagian atas, sebelum stat cards):

```tsx
// useQuery(['products', 'expiring'], () => getExpiringProducts(30))
// Jika ada hasil: tampilkan alert card
// Layout: ikon ⚠️ + teks "X produk hampir kadaluarsa dalam 30 hari"
//         link "Lihat semua" → navigate ke /products dengan filter kadaluarsa
// Jika expired (tanggal sudah lewat): card merah "X produk sudah kadaluarsa!"
// Jika tidak ada: card tidak ditampilkan sama sekali
```

```tsx
// AlertCard component:
function ExpiryAlertCard({ products }: { products: Product[] }) {
  const expired = products.filter(p => getExpiryStatus(p.expiryDate) === 'expired')
  const soon = products.filter(p => ['soon', 'warning'].includes(getExpiryStatus(p.expiryDate)))

  if (products.length === 0) return null

  return (
    <div className={clsx('rounded-lg p-4 flex items-center justify-between mb-4',
      expired.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
    )}>
      {/* isi: icon + teks + link */}
    </div>
  )
}
```

### 3.2 Frontend — RecordSalePage / Cart Integration

Update `RecordSalePage.tsx` (di bagian product grid / search results):

#### Out of Stock
```tsx
// Produk dengan semua sizes.stock = 0:
// - Tampilkan dengan opacity-50
// - Tombol "Tambah" disabled
// - Badge "Habis" di atas gambar/card
```

#### Produk Kadaluarsa
```tsx
// Produk dengan expiryDate sudah lewat:
// - Tampilkan dengan overlay merah ringan
// - Tombol "Tambah" disabled
// - Badge "Kadaluarsa" merah
// - Jika owner tetap ingin jual (edge case): bisa override dengan konfirmasi
//   → tidak diimplementasi Phase 3, cukup disable saja
```

#### Produk Hampir Kadaluarsa (opsional warning)
```tsx
// Jika expiryDate ≤ 7 hari: tampilkan badge kuning "Exp: Xd" di card
// Tidak disable — masih bisa dijual, hanya info
```

---

## File Checklist

### Phase 1 — Backend
- [ ] `pos-lite/server/prisma/schema.prisma` — tambah weight, weightUnit, expiryDate ke Product
- [ ] `prisma db push` — sync schema
- [ ] `products.types.ts` — tambah field ke schema validasi
- [ ] `products.service.ts` — pass field baru + fungsi `getExpiringProducts`
- [ ] `products.controller.ts` — tambah handler `getExpiring`
- [ ] `products.routes.ts` — tambah `GET /expiring` sebelum `/:id`

### Phase 2 — Product UI
- [ ] `types/index.ts` — update Product interface
- [ ] `api/products.ts` — tambah `getExpiringProducts`
- [ ] `features/products/ProductForm.tsx` — field weight + weightUnit + expiryDate
- [ ] `features/products/ProductsPage.tsx` — ExpiryBadge, OOS badge, filter dropdown

### Phase 3 — Alerts & Cart
- [ ] `features/dashboard/DashboardPage.tsx` — ExpiryAlertCard
- [ ] `features/transactions/RecordSalePage.tsx` — disable OOS + expired di cart

---

## Implementation Notes

### Date handling
- Backend menerima ISO string, convert ke `Date` saat simpan ke Prisma
- Frontend input `type="date"` menghasilkan `YYYY-MM-DD`, perlu di-append `T00:00:00.000Z` atau convert sebelum kirim
- Display: gunakan `date-fns` `format(new Date(expiryDate), 'dd MMM yyyy', { locale: id })`

### Weight unit options
Terbatas 5 opsi agar konsisten (tidak free text):
- `g` — gram (makanan, bumbu)
- `kg` — kilogram
- `ml` — mililiter (minuman, cairan)
- `L` — liter
- `pcs` — satuan/pieces (barang yang tidak relevan dengan berat)

### OOS calculation
Tidak butuh field baru. OOS check:
```typescript
const isOutOfStock = product.sizes.every(s => s.stock === 0)
const isPartiallyOOS = product.sizes.some(s => s.stock === 0) && !isOutOfStock
```

Requires `sizes` di-include saat fetch products. Pastikan `getProducts` di service include `sizes`.

### Expiry threshold summary
| Status | Kondisi | Warna |
|--------|---------|-------|
| `expired` | Tanggal sudah lewat | Merah `red` |
| `soon` | ≤ 7 hari lagi | Merah muda `rose` |
| `warning` | 8–30 hari lagi | Kuning `yellow` |
| `ok` | > 30 hari | Hijau `green` (subtle) |
| `none` | Tidak ada expiry date | Abu `-` |

---

## Estimasi Effort

| Phase | Backend | Frontend | Total |
|-------|---------|----------|-------|
| 1 | Schema + 1 endpoint baru | - | Kecil |
| 2 | - | Form + listing badges + filter | Sedang |
| 3 | - | Dashboard alert + cart disable | Kecil |
