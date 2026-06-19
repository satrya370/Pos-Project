# Frontend Implementation Plan — PosLite

**Tanggal:** 2026-06-18  
**Status:** Siap Implementasi  
**Tech:** React 18 + TypeScript + Vite + Tailwind CSS + Zustand + React Query + Recharts

---

## Keputusan yang Sudah Diputuskan

| Aspek | Pilihan |
|-------|---------|
| Navigasi | Sidebar kiri (expand/collapse) |
| POS screen | Form sederhana (dropdown produk + quantity + submit) |
| Dashboard | Summary cards + chart 7 hari + low stock + top/bottom produk |
| Theme | Blue primary (#2563EB) sesuai SPEC |
| Components | Hybrid — build sederhana, pakai library untuk kompleks |
| State | Zustand (auth state) + React Query (server state) |
| HTTP | Axios |

---

## Struktur Folder Frontend

```
client/src/
├── api/
│   ├── client.ts              # Axios instance + interceptors
│   ├── auth.ts                # Login, getMe
│   ├── products.ts            # CRUD products
│   ├── transactions.ts        # Create, list, void
│   └── reports.ts             # Daily, weekly, top-products
├── components/
│   ├── ui/                    # Build dari scratch
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Spinner.tsx
│   │   ├── Modal.tsx
│   │   └── Select.tsx
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── Layout.tsx
│   └── charts/
│       └── SalesChart.tsx     # Recharts wrapper
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── useAuth.ts         # Zustand store
│   ├── products/
│   │   ├── ProductsPage.tsx
│   │   ├── ProductForm.tsx
│   │   └── LowStockAlert.tsx
│   ├── transactions/
│   │   ├── RecordSalePage.tsx
│   │   └── TransactionHistory.tsx
│   └── reports/
│       └── ReportsPage.tsx
├── hooks/
│   └── useApi.ts              # React Query wrappers
├── types/
│   └── index.ts               # Shared types
├── App.tsx
├── main.tsx
└── index.css                  # Tailwind imports
```

---

## 3-Phase Implementation Plan

### **Phase 1: Foundation + Auth** (Estimasi: 1.5 hari)

| Task | File | Detail |
|------|------|--------|
| **1.1** Install deps + Vite config | `package.json`, `vite.config.ts` | Proxy `/api` → `localhost:3000` |
| **1.2** Tailwind setup | `tailwind.config.js`, `index.css` | Blue primary theme |
| **1.3** TypeScript config | `tsconfig.json` | Path alias `@/` |
| **1.4** Shared types | `types/index.ts` | Owner, Product, Transaction, Report types |
| **1.5** API client | `api/client.ts` | Axios instance + token interceptor |
| **1.6** Auth API | `api/auth.ts` | `login()`, `getMe()` |
| **1.7** Auth store | `features/auth/useAuth.ts` | Zustand: token, owner, login(), logout() |
| **1.8** UI components | `components/ui/*` | Button, Input, Card, Badge, Spinner |
| **1.9** Layout | `components/layout/*` | Sidebar, Header, Layout wrapper |
| **1.10** Login page | `features/auth/LoginPage.tsx` | Form email + password |
| **1.11** Protected route | `App.tsx` | Redirect ke `/login` jika belum login |

**Deliverable:** Bisa login, lihat sidebar, navigasi antar halaman (kosong).

---

### **Phase 2: Core Pages** (Estimasi: 3.5 hari)

| Task | File | Detail |
|------|------|--------|
| **2.1** Products API | `api/products.ts` | `getProducts()`, `createProduct()`, `updateProduct()`, `deleteProduct()`, `restock()`, `getLowStock()` |
| **2.2** Products page | `features/products/ProductsPage.tsx` | Tabel produk + search + tombol aksi |
| **2.3** Product form | `features/products/ProductForm.tsx` | Modal tambah/edit produk |
| **2.4** Low stock alert | `features/products/LowStockAlert.tsx` | Komponen notifikasi stok rendah |
| **2.5** Transactions API | `api/transactions.ts` | `createTransaction()`, `getTransactions()`, `voidTransaction()` |
| **2.6** Record sale page | `features/transactions/RecordSalePage.tsx` | Form catat penjualan |
| **2.7** Transaction history | `features/transactions/TransactionHistory.tsx` | Tabel riwayat + filter + void |
| **2.8** Reports API | `api/reports.ts` | `getDaily()`, `getWeekly()`, `getMonthly()`, `getTopProducts()` |
| **2.9** Reports page | `features/reports/ReportsPage.tsx` | Tab harian/mingguan/bulanan/top produk |

**Deliverable:** Semua halaman berfungsi — CRUD produk, catat penjualan, lihat riwayat, cek laporan.

---

### **Phase 3: Dashboard + Polish** (Estimasi: 2 hari)

| Task | File | Detail |
|------|------|--------|
| **3.1** Dashboard API calls | `hooks/useApi.ts` | `useDailyReport()`, `useWeeklyReport()`, `useTopProducts()`, `useLowStock()` |
| **3.2** Dashboard page | `features/dashboard/DashboardPage.tsx` | Summary cards + chart + alerts + top/bottom |
| **3.3** Sales chart | `components/charts/SalesChart.tsx` | Recharts LineChart wrapper |
| **3.4** Dashboard cards | `features/dashboard/SummaryCards.tsx` | 4 cards: hari ini, minggu, bulan, profit |
| **3.5** Top products | `features/dashboard/TopProducts.tsx` | Tabel ranking produk |
| **3.6** Error handling | Global | Error toast, loading states, empty states |
| **3.7** Responsive | All pages | Mobile-friendly sidebar, table scroll |
| **3.8** Polish | All pages | Animasi, hover states, focus states |

**Deliverable:** Dashboard lengkap, semua halaman polished, siap dipakai.

---

## Halaman yang Dibuat

| # | Halaman | Route | Phase |
|---|---------|-------|-------|
| 1 | Login | `/login` | 1 |
| 2 | Dashboard | `/` | 3 |
| 3 | Produk | `/products` | 2 |
| 4 | Catat Penjualan | `/transactions` | 2 |
| 5 | Riwayat Transaksi | `/transactions/history` | 2 |
| 6 | Laporan | `/reports` | 2 |

---

## Detail Setiap Halaman

### 1. Login (`/login`)

**Layout:**
```
┌─────────────────────────────────────┐
│           PosLite Logo              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Email                       │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Password                    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │         LOGIN               │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

**Components:** Input, Button, Card

**Logic:**
- POST `/api/auth/login` → simpan token ke Zustand + localStorage
- Redirect ke `/` setelah login

---

### 2. Dashboard (`/`)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Dashboard                                               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Hari Ini │ │ Minggu   │ │ Bulan    │ │ Profit   │   │
│  │ Rp 2.5jt │ │ Rp 15jt  │ │ Rp 50jt  │ │ Rp 10jt  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│                                                          │
│  ┌────────────────────────┐ ┌────────────────────────┐  │
│  │ Chart 7 Hari           │ │ Low Stock Alert        │  │
│  │ (Recharts LineChart)   │ │ • Kaos M: 3 unit      │  │
│  │                        │ │ • Hoodie: 2 unit       │  │
│  └────────────────────────┘ └────────────────────────┘  │
│                                                          │
│  ┌────────────────────────┐ ┌────────────────────────┐  │
│  │ Top Produk             │ │ Bottom Produk          │  │
│  │ 1. Kaos Hitam (50)    │ │ 1. Gelang (5)          │  │
│  │ 2. Hoodie (30)        │ │ 2. Topi (8)            │  │
│  └────────────────────────┘ └────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Components:** Card, SalesChart, Table, Badge

**API Calls:** daily, weekly, monthly reports + top-products + low-stock

---

### 3. Produk (`/products`)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Produk                               [+ Tambah Produk] │
├─────────────────────────────────────────────────────────┤
│  Search: ┌─────────────────────┐                        │
│          └─────────────────────┘                        │
├─────────────────────────────────────────────────────────┤
│  │ Nama        │ Harga    │ Stok  │ Kategori │ Aksi    │ │
│  ├─────────────┼──────────┼───────┼──────────┼─────────│ │
│  │ Kaos Putih  │ Rp 55.000│ 50    │ Pakaian  │ Edit    │ │
│  │ Kaos Hitam  │ Rp 55.000│ 40    │ Pakaian  │ Edit    │ │
│  │ Hoodie      │ Rp150.000│ 20    │ Pakaian  │ Edit    │ │
│  │ Gelang      │ Rp 15.000│ 100   │ Aksesoris│ Edit    │ │
│  └─────────────┴──────────┴───────┴──────────┴─────────│ │
└─────────────────────────────────────────────────────────┘
```

**Components:** Table, Button, Input, Modal, Badge

---

### 4. Catat Penjualan (`/transactions`)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Catat Penjualan                                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Produk: ┌──────────────────────────────────────┐       │
│          │ Pilih produk...                      ▼│       │
│          └──────────────────────────────────────┘       │
│  Quantity: ┌────────────┐                                │
│           │ 1          │                                 │
│           └────────────┘                                │
│  [Tambah ke List]                                        │
│                                                          │
├─────────────────────────────────────────────────────────┤
│  │ Produk        │ Harga    │ Qty │ Subtotal  │ Hapus  │ │
│  ├───────────────┼──────────┼─────┼───────────┼────────│ │
│  │ Kaos Putih    │ Rp 55.000│  2  │ Rp110.000 │ [x]    │ │
│  │ Kaos Hitam    │ Rp 55.000│  1  │ Rp 55.000 │ [x]    │ │
│  └───────────────┴──────────┴─────┴───────────┴────────┘ │
│                                                          │
│  Total: Rp 165.000                                       │
│  Catatan: ┌──────────────────────────────────────┐       │
│           │                                      │       │
│           └──────────────────────────────────────┘       │
│  [Catat Penjualan]                                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Components:** Select, Input, Button, Table

---

### 5. Riwayat Transaksi (`/transactions/history`)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Riwayat Transaksi                                       │
├─────────────────────────────────────────────────────────┤
│  Filter: [Tanggal Mulai] [Tanggal Akhir] [Cari]         │
├─────────────────────────────────────────────────────────┤
│  │ Invoice      │ Tanggal    │ Total    │ Status │ Aksi │ │
│  ├──────────────┼────────────┼──────────┼────────┼──────│ │
│  │ INV-20260618 │ 18 Jun     │ Rp273.000│ Compl. │ Void │ │
│  │ INV-20260617 │ 17 Jun     │ Rp150.000│ Compl. │ Void │ │
│  └──────────────┴────────────┴──────────┴────────┴──────┘ │
└─────────────────────────────────────────────────────────┘
```

**Components:** Table, Input, Button, Badge

---

### 6. Laporan (`/reports`)

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Laporan                                                 │
├─────────────────────────────────────────────────────────┤
│  Tab: [Harian] [Mingguan] [Bulanan] [Top Produk]        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [Konten tab aktif]                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## State Management

### Zustand (Auth Store)
```typescript
interface AuthState {
  token: string | null
  owner: { id: string; name: string; email: string } | null
  login: (token: string, owner: Owner) => void
  logout: () => void
}
```

### React Query (Server State)
- `useProducts()` → GET `/api/products`
- `useTransactions()` → GET `/api/transactions`
- `useDailyReport(date)` → GET `/api/reports/daily`
- dll.

---

## Components Breakdown

### Build from Scratch (ui/)
| Component | Props | Fungsi |
|-----------|-------|--------|
| `Button` | `variant, size, children, onClick, disabled` | Tombol dengan variasi warna |
| `Input` | `label, type, value, onChange, error` | Form input dengan label |
| `Card` | `children, className` | Container card |
| `Badge` | `variant, children` | Status badge (success/warning/danger) |
| `Spinner` | `size` | Loading indicator |
| `Modal` | `isOpen, onClose, title, children` | Overlay modal |
| `Select` | `label, options, value, onChange` | Dropdown select |

### Hybrid (pakai library)
| Component | Library | Fungsi |
|-----------|---------|--------|
| `Table` | Tanstack Table | Sortable, filterable table |
| `SalesChart` | Recharts | Line/bar chart |

---

## API Integration

### Axios Client
- Base URL dari env: `VITE_API_URL`
- Interceptor: tambah token ke setiap request
- Error handling: redirect ke login jika 401

### React Query Hooks
```typescript
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(r => r.data.data),
  })
}
```

---

## Routes

```tsx
<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<Layout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/transactions" element={<RecordSalePage />} />
      <Route path="/transactions/history" element={<TransactionHistory />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Route>
  </Route>
</Routes>
```

---

## Dependencies (Sudah Ada)

| Package | Fungsi |
|---------|--------|
| react | UI framework |
| react-router-dom | Routing |
| zustand | Auth state |
| @tanstack/react-query | Server state |
| axios | HTTP client |
| recharts | Charts |
| lucide-react | Icons |
| clsx | Conditional classes |
| date-fns | Date formatting |
| tailwindcss | Styling |

---

## Notes

- Backend sudah jalan di `localhost:3000`
- Frontend dev server: `localhost:5173`
- Proxy Vite: `/api` → `localhost:3000`
- AI dan Cron: tidak diimplement dulu
- Product import Excel: ada di Phase 3 backend
