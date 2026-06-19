# PosLite — Dashboard Revamp Implementation Plan
# ID: POS-002

**Date:** 2026-06-19
**Status:** Ready to Implement
**Scope:** Dashboard bug fixes + feature additions
**Approach:** Fix bugs sekaligus dengan fitur baru (single pass)

---

## 1. Ringkasan Perubahan

### Bug Fixes (dikerjakan bersamaan dengan fitur)
| # | Bug | File | Severity |
|---|-----|------|----------|
| B1 | Week format mismatch — client kirim `"2026-W25"`, server `new Date("2026-W25")` = Invalid Date | `useApi.ts`, `reports.service.ts` | 🔴 Critical |
| B2 | Bottom products = reverse of top 10, bukan produk terlaris terbawah | `reports.service.ts` | 🔴 Critical |
| B3 | LowStockAlert threshold hardcode `< 5`, harusnya `minStockThreshold` | `LowStockAlert.tsx` | 🔴 Critical |
| B4 | Monthly report double-count di batas bulan (weekly spans across months) | `reports.service.ts` | 🟠 High |
| B5 | TopProducts kirim period `'monthly'` tapi server tidak handle, fallback 30 hari | `TopProducts.tsx`, `reports.service.ts` | 🟠 High |
| B6 | Weekly report di-fetch dua kali (berbeda React Query key) | `useApi.ts`, `DashboardPage.tsx` | 🟡 Medium |

### Fitur Baru
| # | Fitur | Effort |
|---|-------|--------|
| F1 | Summary cards: tambah transaksi count + item sold + profit hari ini | Kecil |
| F2 | Summary cards: perbandingan nominal + % vs periode sebelumnya | Sedang |
| F3 | Pisah Out of Stock (0) vs Low Stock, dengan tombol restock inline | Kecil |
| F4 | Recent transactions — 5 transaksi terakhir hari ini | Sedang |
| F5 | Produk tidak bergerak (no sales 30 hari) + total nilai stok | Sedang |
| F6 | Target harian — progress bar + set target modal | Besar |
| F7 | Quick action button "Catat Penjualan" di atas dashboard | Kecil |
| F8 | Empty state informatif kalau belum ada transaksi hari ini | Kecil |

---

## 2. Perubahan Backend

### 2.1 Schema Prisma — tambah field `dailyTarget`

**File:** `server/prisma/schema.prisma`

```prisma
model Owner {
  // ... existing fields ...
  dailyTarget  Int?     // target penjualan harian dalam rupiah
}
```

Jalankan setelah:
```bash
npx prisma migrate dev --name add_daily_target
```

---

### 2.2 Fix: Reports Service

**File:** `server/src/features/reports/reports.service.ts`

#### Fix B1 — Week format
```typescript
// SEBELUM (bug): server terima "2026-W25" → new Date("2026-W25") = Invalid Date
export async function getWeeklyReport(ownerId: string, week?: string): Promise<WeeklyReport> {
  const d = week ? new Date(week) : new Date()

// SESUDAH: terima date string biasa (YYYY-MM-DD), hitung start of week dari sana
export async function getWeeklyReport(ownerId: string, startDate?: string): Promise<WeeklyReport> {
  const d = startDate ? new Date(startDate) : new Date()
  // d sekarang valid karena pakai ISO date string
```

Client juga diubah — tidak lagi kirim format `"yyyy-'W'II"`, tapi kirim `"yyyy-MM-dd"` (senin minggu ini).

#### Fix B2 — Bottom products (query terpisah)
```typescript
// SEBELUM (bug):
const topProducts = await getTopProductsForPeriod(ownerId, start, end, 10)
const bottomProducts = [...topProducts].reverse()  // ❌ ini salah

// SESUDAH: query semua produk yang terjual, sort ascending
async function getBottomProductsForPeriod(...): Promise<ProductRank[]> {
  const items = await prisma.transactionItem.findMany({ ... })
  const productMap = buildProductMap(items)

  // Ambil semua produk owner, merge dengan yang terjual (0 kalau tidak terjual)
  const allProducts = await prisma.product.findMany({ where: { ownerId } })
  
  return allProducts
    .map(p => productMap.get(p.id) ?? { productId: p.id, productName: p.name, quantity: 0, revenue: 0 })
    .sort((a, b) => a.quantity - b.quantity)  // ascending = terbawah dulu
    .slice(0, 5)
}
```

#### Fix B4 — Monthly total pakai direct query, bukan sum weekly
```typescript
// SESUDAH: hitung total langsung dari DB, bukan sum dari weekly breakdown
export async function getMonthlyReport(ownerId: string, month?: string): Promise<MonthlyReport> {
  const d = month ? new Date(`${month}-01`) : new Date()
  const year = d.getFullYear()
  const m = d.getMonth()
  
  const start = new Date(year, m, 1)
  const end = new Date(year, m + 1, 0, 23, 59, 59, 999)
  
  // Query langsung untuk total — akurat, tidak double count
  const transactions = await prisma.transaction.findMany({
    where: { ownerId, createdAt: { gte: start, lte: end }, status: 'completed' },
  })
  const agg = aggregateTransactions(transactions)
  
  // Weekly breakdown tetap ada untuk chart, tapi tidak dipakai untuk total
  const weeklyBreakdown = await buildWeeklyBreakdown(ownerId, year, m)
  
  return { month: monthStr, weeklyBreakdown, ...agg }
}
```

#### Fix B5 + Tambah perbandingan di daily report

```typescript
// Tambah interface baru
interface DailyReportWithComparison extends DailyReport {
  comparison: {
    sales: { amount: number; percent: number }
    profit: { amount: number; percent: number }
    transactions: { amount: number; percent: number }
  }
}

// getDailyReport sekarang fetch kemarin juga untuk comparison
export async function getDailyReport(ownerId: string, date?: string): Promise<DailyReportWithComparison> {
  // ... fetch today ...
  
  // Fetch yesterday untuk comparison
  const yesterday = new Date(dateStr)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = formatDateStr(yesterday)
  const yesterdayTransactions = await prisma.transaction.findMany({ ... })
  const yesterdayAgg = aggregateTransactions(yesterdayTransactions)
  
  return {
    date: dateStr,
    ...agg,
    topProducts,
    comparison: {
      sales: calcComparison(agg.totalSales, yesterdayAgg.totalSales),
      profit: calcComparison(agg.profit, yesterdayAgg.profit),
      transactions: calcComparison(agg.transactionsCount, yesterdayAgg.transactionsCount),
    }
  }
}

function calcComparison(current: number, previous: number) {
  const amount = current - previous
  const percent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((amount / previous) * 100)
  return { amount, percent }
}
```

---

### 2.3 Endpoint Baru

#### `GET /api/products/stock-summary`
```typescript
// Response:
{
  totalStockValue: number,      // total modal nyangkut di stok (stock × purchasePrice)
  outOfStockCount: number,      // produk/size dengan stock = 0
  lowStockCount: number,        // produk/size dengan stock < minStockThreshold
  deadStockProducts: Product[], // produk tidak terjual 30 hari tapi stok > 0
}
```

#### `GET /api/owner/target`
```typescript
// Response:
{ dailyTarget: number | null }
```

#### `PUT /api/owner/target`
```typescript
// Body: { dailyTarget: number }
// Response: { dailyTarget: number }
```

#### `GET /api/transactions` — tambah support `?date=today&limit=5`
Endpoint sudah ada, tinggal tambah filter limit.

---

## 3. Perubahan Frontend

### 3.1 Layout Dashboard Baru

```
┌─────────────────────────────────────────────────────────────┐
│  Dashboard                    [+ Catat Penjualan] ← F7      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [Hari Ini]  [Minggu Ini]  [Bulan Ini]  [Profit Bln]  [Target] │
│   + count     + % vs lalu   + % vs lalu  + % vs lalu   progress │
│   + items                                               ← F1,F2,F6 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Grafik 7 Hari (2/3)  │  Stock Alerts (1/3)               │
│                        │  🔴 Stok Habis (2)  [Restock]     │
│                        │  🟠 Stok Rendah (5) [Restock]     │
│                        │                        ← F3        │
├─────────────────────────────────────────────────────────────┤
│  Recent Transactions (1/2) │  Stock Summary (1/2)          │
│  • INV-001  Rp 150k  14:32 │  💰 Nilai Stok: Rp 12.5jt    │
│  • INV-002  Rp 89k   13:15 │  📦 Tdk bergerak: 3 produk    │
│  • ...                     │                        ← F4,F5 │
├─────────────────────────────────────────────────────────────┤
│  Top Produk           │  Bottom Produk                      │
│  (fixed: real bottom) │                                     │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.2 Modifikasi Komponen

#### `SummaryCards.tsx` — F1 + F2

Setiap card berubah dari:
```
Penjualan Hari Ini
Rp 1.250.000
```

Menjadi:
```
Penjualan Hari Ini
Rp 1.250.000
▲ Rp 150.000 (12%) vs kemarin
15 transaksi · 32 item
```

Tambah prop `comparison` dan `meta` ke `StatCard`.

---

#### `LowStockAlert.tsx` → `StockAlertsPanel.tsx` — F3

Split jadi dua section:
```tsx
// Section 1: Out of Stock (stock === 0) — merah, paling atas
// Section 2: Low Stock (stock < minStockThreshold) — oranye

// Tiap item punya tombol inline
<Button size="sm" onClick={() => navigate(`/products/${product.id}?action=restock`)}>
  Restock
</Button>
```

Fix threshold:
```typescript
// SEBELUM
const lowSizes = product.sizes.filter(s => s.stock < 5)

// SESUDAH
const outOfStockSizes = product.sizes.filter(s => s.stock === 0)
const lowSizes = product.sizes.filter(s => s.stock > 0 && s.stock < product.minStockThreshold)
```

---

### 3.3 Komponen Baru

#### `RecentTransactions.tsx` — F4

```tsx
// Fetch 5 transaksi hari ini
// Tampilkan: invoice number, total, jam, status badge
// Link ke /transactions/history untuk lihat semua

function RecentTransactions() {
  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions', 'today', 'recent'],
    queryFn: () => getTransactions({ date: today, limit: 5 }),
  })

  if (transactions.length === 0) {
    return <EmptyState />  // F8
  }

  return (
    <Card>
      <h3>Transaksi Hari Ini</h3>
      {transactions.map(t => (
        <TransactionRow key={t.id} transaction={t} />
      ))}
      <Link to="/transactions/history">Lihat semua →</Link>
    </Card>
  )
}
```

---

#### `StockSummaryCard.tsx` — F5

```tsx
// Data dari GET /api/products/stock-summary
function StockSummaryCard() {
  const { data } = useQuery({ queryKey: ['products', 'stock-summary'], queryFn: getStockSummary })

  return (
    <Card>
      <h3>Ringkasan Stok</h3>
      <div>
        <span>💰 Nilai Stok</span>
        <span>{formatPrice(data.totalStockValue)}</span>
      </div>
      {data.deadStockProducts.length > 0 && (
        <div>
          <span>⚠️ Tidak bergerak 30 hari</span>
          <span>{data.deadStockProducts.length} produk</span>
          // expandable list
        </div>
      )}
    </Card>
  )
}
```

---

#### `DailyTargetCard.tsx` — F6

```tsx
function DailyTargetCard({ todaySales }: { todaySales: number }) {
  const { data } = useQuery({ queryKey: ['owner', 'target'], queryFn: getOwnerTarget })
  const [showSetTarget, setShowSetTarget] = useState(false)

  const target = data?.dailyTarget ?? 0
  const progress = target > 0 ? Math.min((todaySales / target) * 100, 100) : 0

  return (
    <Card>
      <div className="flex justify-between">
        <span>Target Harian</span>
        <button onClick={() => setShowSetTarget(true)}>Edit</button>
      </div>
      {target === 0 ? (
        <button onClick={() => setShowSetTarget(true)}>Set Target →</button>
      ) : (
        <>
          <ProgressBar value={progress} />
          <span>{formatPrice(todaySales)} / {formatPrice(target)}</span>
          <span>{progress.toFixed(0)}% tercapai</span>
        </>
      )}

      {showSetTarget && <SetTargetModal onClose={() => setShowSetTarget(false)} />}
    </Card>
  )
}
```

---

#### `QuickActionButton.tsx` — F7

```tsx
// Tombol fixed/sticky di atas halaman dashboard
function QuickActionButton() {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Dashboard</h2>
      </div>
      <Button onClick={() => navigate('/transactions')}>
        <Plus className="h-4 w-4 mr-2" />
        Catat Penjualan
      </Button>
    </div>
  )
}
```

---

#### `EmptyDashboard.tsx` — F8

```tsx
// Tampil kalau transactionsCount === 0 hari ini
function EmptyDayState() {
  return (
    <div className="text-center py-8 text-gray-500">
      <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
      <p className="font-medium">Belum ada penjualan hari ini</p>
      <p className="text-sm mb-4">Yuk catat transaksi pertamamu!</p>
      <Button onClick={() => navigate('/transactions')}>
        Catat Penjualan →
      </Button>
    </div>
  )
}
```

---

### 3.4 Fix useApi.ts — B1 + B6

```typescript
// SEBELUM (bug B1):
const reportWeek = week || format(new Date(), "yyyy-'W'II")  // → "2026-W25" tidak bisa di-parse server

// SESUDAH: kirim tanggal hari Senin minggu ini sebagai anchor
function getStartOfWeek(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Senin
  d.setDate(diff)
  return format(d, 'yyyy-MM-dd')
}

export function useWeeklyReport(date?: string) {
  const startOfWeek = date || getStartOfWeek(new Date())
  return useQuery({
    queryKey: ['reports', 'weekly', startOfWeek],
    queryFn: () => getWeeklyReport(startOfWeek),
  })
}

// Fix B6: useWeeklySalesChart pakai data dari useWeeklyReport (shared cache)
export function useWeeklySalesChart() {
  const { data: weeklyReport } = useWeeklyReport()
  return {
    data: weeklyReport?.dailyBreakdown.map(day => ({
      date: format(new Date(day.date), 'EEE'),
      sales: day.totalSales,
      profit: day.profit,
    })) ?? [],
    isLoading: !weeklyReport,
  }
}
```

---

## 4. Urutan Implementasi

```
Step 1 — Backend schema + migration
  └── Tambah dailyTarget ke Owner

Step 2 — Backend: fix reports service
  ├── Fix week format (B1)
  ├── Fix bottom products (B2)
  ├── Fix monthly total (B4)
  └── Tambah comparison ke daily report

Step 3 — Backend: endpoint baru
  ├── GET /api/products/stock-summary
  ├── GET /api/owner/target
  └── PUT /api/owner/target

Step 4 — Frontend: fix hooks + types
  ├── Fix useApi.ts week format (B1, B6)
  └── Update types/index.ts (DailyReportWithComparison)

Step 5 — Frontend: modifikasi komponen existing
  ├── SummaryCards.tsx (F1, F2)
  ├── LowStockAlert → StockAlertsPanel (B3, F3)
  └── TopProducts.tsx (B5)

Step 6 — Frontend: komponen baru
  ├── RecentTransactions.tsx (F4)
  ├── StockSummaryCard.tsx (F5)
  ├── DailyTargetCard.tsx (F6)
  ├── QuickActionButton.tsx (F7)
  └── EmptyDayState.tsx (F8)

Step 7 — Frontend: DashboardPage.tsx
  └── Susun layout baru dengan semua komponen

Step 8 — Testing
  ├── Verify week format fix
  ├── Verify bottom products benar
  ├── Verify comparison data akurat
  └── Verify target flow (set → tampil → progress)
```

---

## 5. File yang Terpengaruh

### Backend
```
server/prisma/schema.prisma                          ← tambah dailyTarget
server/prisma/migrations/...                         ← migration baru
server/src/features/reports/reports.service.ts       ← fix B1, B2, B4, B5 + comparison
server/src/features/reports/reports.types.ts         ← tambah DailyReportWithComparison
server/src/features/products/products.service.ts     ← tambah stock-summary logic
server/src/features/products/products.controller.ts  ← tambah /stock-summary endpoint
server/src/features/products/products.routes.ts      ← tambah route
server/src/features/auth/auth.service.ts             ← tambah getTarget, updateTarget
server/src/features/auth/auth.controller.ts          ← tambah handler
server/src/features/auth/auth.routes.ts              ← tambah /target routes
```

### Frontend
```
client/src/hooks/useApi.ts                           ← fix B1, B6
client/src/types/index.ts                            ← update DailyReport type
client/src/api/reports.ts                            ← update param type
client/src/features/dashboard/DashboardPage.tsx      ← layout baru
client/src/features/dashboard/SummaryCards.tsx       ← F1, F2
client/src/features/dashboard/TopProducts.tsx        ← fix B5
client/src/features/dashboard/RecentTransactions.tsx ← baru F4
client/src/features/dashboard/DailyTargetCard.tsx    ← baru F6
client/src/features/dashboard/StockSummaryCard.tsx   ← baru F5
client/src/features/dashboard/EmptyDayState.tsx      ← baru F8
client/src/features/products/LowStockAlert.tsx       ← fix B3, F3 → rename StockAlertsPanel
client/src/components/ui/ProgressBar.tsx             ← komponen baru (untuk target)
```

---

## 6. Estimasi Effort

| Step | Estimasi |
|------|----------|
| Backend schema + migration | 15 menit |
| Backend reports fix | 45 menit |
| Backend endpoint baru | 30 menit |
| Frontend hooks + types | 20 menit |
| Frontend modifikasi existing | 45 menit |
| Frontend komponen baru | 60 menit |
| Dashboard layout assembly | 30 menit |
| Testing & polish | 30 menit |
| **Total** | **~4.5 jam** |

---

**Status:** Plan approved, siap implementasi
**Next:** Mulai dari Step 1 — backend schema migration
