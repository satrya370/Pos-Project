import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/layout/Layout'
import { LoginPage } from '@/features/auth/LoginPage'
import { useAuthRedirect } from '@/hooks/useAuthRedirect'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedRoute() {
  const { isLoading, isAuthenticated } = useAuthRedirect()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Layout />
}

function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
      <p className="text-gray-500 mt-2">Selamat datang di PosLite!</p>
    </div>
  )
}

function ProductsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Produk</h2>
      <p className="text-gray-500 mt-2">Manajemen produk</p>
    </div>
  )
}

function TransactionsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Catat Penjualan</h2>
      <p className="text-gray-500 mt-2">Form pencatatan penjualan</p>
    </div>
  )
}

function TransactionHistoryPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h2>
      <p className="text-gray-500 mt-2">Riwayat transaksi</p>
    </div>
  )
}

function ReportsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800">Laporan</h2>
      <p className="text-gray-500 mt-2">Laporan penjualan</p>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/transactions/history" element={<TransactionHistoryPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
