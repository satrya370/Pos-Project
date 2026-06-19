# PosLite — Advanced Analytics & Reports Implementation Plan
# ID: POS-004 | Date: 2026-06-19 | Status: Ready to Implement

## Scope

| # | Feature | Phase |
|---|---------|-------|
| A1 | Analytics Tab — Top Produk, Top Kategori, Top Customer (bar chart, 1/7/30) | 1 |
| A2 | Analytics Tab — Top Produk per Kategori (bar chart + category filter) | 1 |
| A3 | Analytics Tab — Top Bundle (pairs, relevance badge, 1/7/30) | 1 |
| A4 | Margin & Profit per produk/kategori | 2 |
| A5 | Perbandingan Periode (periode ini vs sebelumnya, delta %) | 2 |
| A6 | Dead Stock / Slow Moving (threshold 30/60/90 hari) | 3 |
| A7 | Peak Hours & Peak Days (jam/hari penjualan tertinggi, 1/7/30) | 3 |

**User decisions:**
- Visualisasi: bar chart (recharts)
- Bundle threshold: Opsi C — top 10 pasangan, relevance badge (≥5x hijau, 2-4x kuning, 1x abu)
- UI: satu period filter (1/7/30 hari) di tab Analitik mengontrol semua widget
- Lokasi: tab baru "Analitik" di ReportsPage yang sudah ada
- High-impact extras: Perbandingan Periode, Dead Stock, Peak Hours/Days

---

## Architecture Overview

### Backend: semua endpoint baru di `/api/reports/`

```
GET /reports/analytics?period=7        → A1, A2, A3 (satu round-trip)
GET /reports/profit-margin?period=30   → A4
GET /reports/comparison?period=7       → A5
GET /reports/dead-stock?threshold=30   → A6
GET /reports/peak-time?period=30       → A7
```

### Frontend: tab "Analitik" di ReportsPage

```
ReportsPage
  ├── Tab: Harian    (existing)
  ├── Tab: Bulanan   (existing)
  └── Tab: Analitik  (NEW)
        ├── PeriodFilter (1H / 7H / 30H)    ← satu filter mengontrol A1–A3
        ├── TopProductsChart                 ← A1
        ├── TopCategoriesChart               ← A1
        ├── TopCustomersChart                ← A1
        ├── TopProductByCategoryChart        ← A2 (+ dropdown kategori)
        ├── TopBundleList                    ← A3 (relevance badges)
        ├── ProfitMarginSection              ← A4 (Phase 2)
        ├── PeriodComparisonSection          ← A5 (Phase 2)
        ├── DeadStockTable                   ← A6 (Phase 3, threshold filter)
        └── PeakTimeCharts                   ← A7 (Phase 3, jam + hari)
```

### Dependency baru: `recharts`
```bash
cd pos-lite/client && npm install recharts
```
Dipakai untuk: horizontal bar chart (rankings) + heatmap-style bar chart (peak time).

---

## Phase 1: Analytics Tab + Top Charts + Bundle

### 1.1 Backend — `reports.analytics.service.ts` (new file)

File baru di `pos-lite/server/src/features/reports/reports.analytics.service.ts`

#### Helper: `getDateRange(period: number): { start: Date, end: Date }`
```typescript
// period = 1 | 7 | 30 (hari ke belakang dari sekarang)
function getDateRange(period: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - period)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}
```

#### A1a: `getTopProducts(ownerId, period)`
```typescript
// GROUP BY productId, SUM(quantity), filter by date range + status=completed
// Return: [{ productId, productName, totalQty, totalRevenue }] top 10
```
Query via Prisma: `groupBy` TransactionItem JOIN Transaction (ownerId, date, status).

#### A1b: `getTopCategories(ownerId, period)`
```typescript
// JOIN TransactionItem → Product → Category
// GROUP BY categoryId, SUM(quantity * price)
// Return: [{ categoryId, categoryName, totalRevenue, totalQty }] top 10
// Raw query lebih efisien di SQLite
```
Gunakan `prisma.$queryRaw` untuk join 3 level.

#### A1c: `getTopCustomers(ownerId, period)`
```typescript
// GROUP BY customerId / customerName (handle walk-in)
// SUM(totalAmount), COUNT(transactions)
// Return: [{ label, totalSpend, txCount }] top 10
// Walk-in: customerName ada, customerId null → pakai nama sebagai label
```

#### A2: `getTopProductsByCategory(ownerId, period, categoryId?)`
```typescript
// Jika categoryId diberikan: filter ke satu kategori
// Jika tidak: ambil top 3 produk dari tiap kategori, flatten
// Return: [{ categoryName, productName, totalQty }]
```

#### A3: `getTopBundles(ownerId, period)`
```typescript
// Self-join TransactionItem on transactionId
// WHERE a.productId < b.productId (hindari duplikasi pasangan)
// GROUP BY (a.productId, b.productId), COUNT(*) as frequency
// ORDER BY frequency DESC LIMIT 10
// Return: [{ productAName, productBName, frequency, badge }]
// badge logic: frequency >= 5 → 'strong', 2-4 → 'moderate', 1 → 'weak'
```
SQL query:
```sql
SELECT
  pa.name as productAName,
  pb.name as productBName,
  COUNT(*) as frequency
FROM TransactionItem a
JOIN TransactionItem b
  ON a.transactionId = b.transactionId AND a.productId < b.productId
JOIN Transaction t ON a.transactionId = t.id
JOIN Product pa ON a.productId = pa.id
JOIN Product pb ON b.productId = pb.id
WHERE t.ownerId = ? AND t.createdAt >= ? AND t.status = 'completed'
GROUP BY a.productId, b.productId
ORDER BY frequency DESC
LIMIT 10
```
Jalankan via `prisma.$queryRaw`.

#### Endpoint gabungan `getAnalytics(ownerId, period, categoryId?)`
```typescript
// Panggil semua A1-A3 secara paralel (Promise.all)
// Return satu objek: { topProducts, topCategories, topCustomers,
//                      topProductsByCategory, topBundles }
```

### 1.2 Backend — tambah ke `reports.controller.ts`

```typescript
getAnalytics: async (req, res, next) => {
  const period = parseInt(req.query.period as string) || 7
  const categoryId = req.query.categoryId as string | undefined
  const data = await analyticsService.getAnalytics(req.owner!.id, period, categoryId)
  res.json({ success: true, data })
}
```

### 1.3 Backend — tambah route di `reports.routes.ts`

```typescript
router.get('/analytics', reportsController.getAnalytics)
// Tambahkan SEBELUM route /:id jika ada
```

### 1.4 Frontend — `api/reports.ts` tambah

```typescript
export interface AnalyticsData {
  topProducts: { productName: string; totalQty: number; totalRevenue: number }[]
  topCategories: { categoryName: string; totalRevenue: number; totalQty: number }[]
  topCustomers: { label: string; totalSpend: number; txCount: number }[]
  topProductsByCategory: { categoryName: string; productName: string; totalQty: number }[]
  topBundles: { productAName: string; productBName: string; frequency: number; badge: 'strong' | 'moderate' | 'weak' }[]
}

export async function getAnalytics(period: number, categoryId?: string): Promise<AnalyticsData>
```

### 1.5 Frontend — Komponen baru di `features/reports/analytics/`

```
features/reports/analytics/
  ├── AnalyticsTab.tsx          ← container utama, period state, useQuery
  ├── TopBarChart.tsx           ← reusable horizontal bar chart (recharts)
  ├── TopProductsByCategory.tsx ← bar chart + dropdown filter kategori
  └── TopBundleList.tsx         ← list dengan relevance badge
```

#### `TopBarChart.tsx` — reusable
```tsx
// Props: data: { label: string; value: number }[], title, valuePrefix?, valueSuffix?
// Recharts: ResponsiveContainer + BarChart (layout="vertical") + Bar
// Warna: primary brand color, tooltip formatRp
```

#### `AnalyticsTab.tsx`
```tsx
// State: period (1|7|30), selectedCategory
// useQuery(['analytics', period, selectedCategory], () => getAnalytics(...))
// Grid layout 2 kolom di desktop, 1 kolom mobile
// Setiap widget dalam Card dengan judul + subtitle "(X hari terakhir)"
```

#### `TopBundleList.tsx`
```tsx
// Badge: strong → bg-green-100 text-green-700 "Sering"
//        moderate → bg-yellow-100 text-yellow-700 "Kadang"
//        weak → bg-gray-100 text-gray-500 "Jarang"
// Format: "Produk A + Produk B" dengan badge dan "dibeli bersama Nx"
```

### 1.6 Frontend — Update `ReportsPage.tsx`

Tambah tab ketiga:
```tsx
// Tab state tambah 'analytics'
// Render <AnalyticsTab /> saat tab === 'analytics'
```

---

## Phase 2: Profit Margin + Period Comparison

### 2.1 Backend — `getTopProductsByMargin(ownerId, period)`

```typescript
// JOIN TransactionItem dengan StockMovement (type='IN') per produk
// Hitung rata-rata purchase price dari restock terakhir per produk
// Margin = (sellingPrice - avgPurchasePrice) / sellingPrice * 100
// Return: [{ productName, categoryName, avgSellingPrice, avgCostPrice,
//            marginPercent, totalRevenue, totalProfit }] top 20
```

**Catatan:** tidak semua produk punya data restock (purchase price bisa null). 
- Tampilkan produk dengan data restock saja, atau
- Tampilkan semua dengan kolom margin "-" kalau data tidak lengkap (lebih informatif)

### 2.2 Backend — `getPeriodComparison(ownerId, period)`

```typescript
// period = 7 | 30
// current: last N days
// previous: N days sebelum current
// Return: {
//   current: { revenue, txCount, avgOrderValue, topProduct },
//   previous: { revenue, txCount, avgOrderValue, topProduct },
//   delta: { revenuePercent, txCountPercent, avgOrderValuePercent }
// }
// delta = (current - previous) / previous * 100
```

### 2.3 Frontend — Komponen baru di `features/reports/analytics/`

```
├── ProfitMarginTable.tsx   ← sortable table, kolom margin%+profit
└── PeriodComparison.tsx    ← 3 KPI card dengan delta badge (↑↓)
```

#### `PeriodComparison.tsx`
```tsx
// 3 KPI cards: Revenue, Jumlah Transaksi, Rata-rata Nilai Order
// Delta badge: hijau ↑X% kalau positif, merah ↓X% kalau negatif
// Sub-label: "vs 7 hari sebelumnya"
```

#### `ProfitMarginTable.tsx`
```tsx
// Kolom: Produk, Kategori, Harga Jual, Harga Beli, Margin%, Total Profit
// Sort by margin% default
// Row dengan margin < 20% highlight merah muda (alert low margin)
// Produk tanpa data harga beli tampilkan "-" di kolom cost/margin
```

---

## Phase 3: Dead Stock + Peak Time

### 3.1 Backend — `getDeadStock(ownerId, threshold)`

```typescript
// threshold = 30 | 60 | 90 (hari)
// Produk yang total stock > 0 DAN tidak ada TransactionItem dalam N hari terakhir
// Return: [{ productId, productName, categoryName, currentStock,
//            lastSoldAt, daysSinceLastSale }]
// Ordered by daysSinceLastSale DESC
```

```sql
SELECT p.id, p.name, c.name as categoryName,
  SUM(ps.stock) as currentStock,
  MAX(t.createdAt) as lastSoldAt,
  JULIANDAY('now') - JULIANDAY(MAX(t.createdAt)) as daysSince
FROM Product p
LEFT JOIN Category c ON p.categoryId = c.id
LEFT JOIN ProductSize ps ON ps.productId = p.id
LEFT JOIN TransactionItem ti ON ti.productId = p.id
LEFT JOIN Transaction t ON ti.transactionId = t.id
  AND t.ownerId = ? AND t.status = 'completed'
WHERE p.ownerId = ?
GROUP BY p.id
HAVING currentStock > 0 AND (lastSoldAt IS NULL OR daysSince > ?)
ORDER BY daysSince DESC
```

### 3.2 Backend — `getPeakTime(ownerId, period)`

```typescript
// period = 1 | 7 | 30
// Return:
//   byHour: [{ hour: 0-23, txCount, revenue }]  (jam 0-23)
//   byDay:  [{ day: 0-6, txCount, revenue }]    (0=Minggu .. 6=Sabtu)
// Gunakan SQLite strftime('%H', createdAt) dan strftime('%w', ...)
```

```sql
-- By hour:
SELECT strftime('%H', createdAt) as hour,
  COUNT(*) as txCount, SUM(totalAmount) as revenue
FROM Transaction
WHERE ownerId = ? AND createdAt >= ? AND status = 'completed'
GROUP BY hour

-- By day of week:
SELECT strftime('%w', createdAt) as day,
  COUNT(*) as txCount, SUM(totalAmount) as revenue
FROM Transaction
WHERE ownerId = ? AND createdAt >= ? AND status = 'completed'
GROUP BY day
```

### 3.3 Frontend — Komponen baru

```
├── DeadStockTable.tsx    ← table + threshold toggle (30/60/90)
└── PeakTimeCharts.tsx    ← 2 bar charts: by hour + by day
```

#### `DeadStockTable.tsx`
```tsx
// Threshold toggle: 30 Hari | 60 Hari | 90 Hari (independent dari period filter utama)
// Kolom: Produk, Kategori, Stok Saat Ini, Terakhir Terjual, Hari Tidak Terjual
// Row dengan stok > 10 + tidak terjual > 60 hari → highlight merah (dead inventory risk)
// Terakhir Terjual: "Belum pernah" jika lastSoldAt null
```

#### `PeakTimeCharts.tsx`
```tsx
// Side by side: "Jam Tersibuk" (0-23) + "Hari Tersibuk" (Sen-Min)
// Jam: bar chart 24 bar, tooltip "XX:00 — N transaksi"
// Hari: bar chart 7 bar, label hari Indonesia (Sen/Sel/Rab/Kam/Jum/Sab/Min)
// Bar tertinggi di-highlight dengan warna berbeda (accent color)
```

---

## File Checklist

### Phase 1
**Backend (server/src/features/reports/)**
- [ ] `reports.analytics.service.ts` (new)
- [ ] `reports.controller.ts` (add `getAnalytics`)
- [ ] `reports.routes.ts` (add `/analytics` route)

**Frontend (client/src/)**
- [ ] `package.json` — tambah `recharts`
- [ ] `api/reports.ts` — tambah `getAnalytics`, type `AnalyticsData`
- [ ] `features/reports/analytics/AnalyticsTab.tsx` (new)
- [ ] `features/reports/analytics/TopBarChart.tsx` (new)
- [ ] `features/reports/analytics/TopProductsByCategory.tsx` (new)
- [ ] `features/reports/analytics/TopBundleList.tsx` (new)
- [ ] `features/reports/ReportsPage.tsx` (add Analytics tab)

### Phase 2
**Backend**
- [ ] `reports.analytics.service.ts` — tambah `getTopProductsByMargin`, `getPeriodComparison`
- [ ] `reports.controller.ts` — tambah `getProfitMargin`, `getPeriodComparison`
- [ ] `reports.routes.ts` — tambah `/profit-margin`, `/comparison`

**Frontend**
- [ ] `api/reports.ts` — tambah `getProfitMargin`, `getPeriodComparison`, tipe baru
- [ ] `features/reports/analytics/ProfitMarginTable.tsx` (new)
- [ ] `features/reports/analytics/PeriodComparison.tsx` (new)
- [ ] `features/reports/analytics/AnalyticsTab.tsx` — mount Phase 2 components

### Phase 3
**Backend**
- [ ] `reports.analytics.service.ts` — tambah `getDeadStock`, `getPeakTime`
- [ ] `reports.controller.ts` — tambah `getDeadStock`, `getPeakTime`
- [ ] `reports.routes.ts` — tambah `/dead-stock`, `/peak-time`

**Frontend**
- [ ] `api/reports.ts` — tambah `getDeadStock`, `getPeakTime`, tipe baru
- [ ] `features/reports/analytics/DeadStockTable.tsx` (new)
- [ ] `features/reports/analytics/PeakTimeCharts.tsx` (new)
- [ ] `features/reports/analytics/AnalyticsTab.tsx` — mount Phase 3 components

---

## Implementation Notes

### SQLite raw query via Prisma
Gunakan `prisma.$queryRaw<T[]>` dengan `Prisma.sql` template tag untuk semua query yang butuh multi-join atau SQLite functions (strftime, JULIANDAY):
```typescript
import { Prisma } from '@prisma/client'
const result = await prisma.$queryRaw<Row[]>(
  Prisma.sql`SELECT ... WHERE ownerId = ${ownerId}`
)
```

### recharts pattern
```tsx
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'
// Layout vertical untuk horizontal bar (ranking list)
<ResponsiveContainer width="100%" height={300}>
  <BarChart layout="vertical" data={data}>
    <XAxis type="number" />
    <YAxis type="category" dataKey="label" width={120} />
    <Bar dataKey="value" fill="var(--color-primary)" radius={[0,4,4,0]} />
    <Tooltip formatter={(v) => formatRp(v as number)} />
  </BarChart>
</ResponsiveContainer>
```

### Period filter type
```typescript
type Period = 1 | 7 | 30
// Tombol toggle, bukan dropdown, karena hanya 3 opsi
```

### Bundle SQL di Prisma
SQLite `$queryRaw` tidak support template dengan array values langsung — pass ownerId dan date sebagai parameter terisolasi via `Prisma.sql`:
```typescript
Prisma.sql`... WHERE t.ownerId = ${ownerId} AND t.createdAt >= ${start.toISOString()}`
```

---

## Estimasi Effort

| Phase | Backend | Frontend | Total |
|-------|---------|----------|-------|
| 1 | 1 service file + 2 controller/route edits | 5 komponen baru + 1 edit | ~medium |
| 2 | 2 functions + 2 routes | 2 komponen baru + 1 edit | ~small |
| 3 | 2 functions + 2 routes | 2 komponen baru + 1 edit | ~small |

Phase 1 adalah yang terbesar karena setup recharts + tab structure + 5 widget sekaligus. Phase 2 & 3 lebih incremental.
