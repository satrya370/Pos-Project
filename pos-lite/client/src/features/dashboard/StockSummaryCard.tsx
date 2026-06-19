import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { useStockSummary } from '@/hooks/useApi'
import { Package, TrendingDown, DollarSign, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

export function StockSummaryCard() {
  const { data, isLoading } = useStockSummary()
  const [showDeadStock, setShowDeadStock] = useState(false)

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold text-gray-800">Ringkasan Stok</h3>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Total Nilai Stok</span>
            </div>
            <span className="text-sm font-semibold text-gray-800">
              {formatPrice(data?.totalStockValue ?? 0)}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-600">Varian Habis</span>
            <span className={`text-sm font-semibold ${(data?.outOfStockCount ?? 0) > 0 ? 'text-danger' : 'text-success'}`}>
              {data?.outOfStockCount ?? 0} varian
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-gray-50">
            <span className="text-sm text-gray-600">Stok Rendah</span>
            <span className={`text-sm font-semibold ${(data?.lowStockCount ?? 0) > 0 ? 'text-warning' : 'text-success'}`}>
              {data?.lowStockCount ?? 0} varian
            </span>
          </div>

          {(data?.deadStockProducts?.length ?? 0) > 0 && (
            <div>
              <button
                onClick={() => setShowDeadStock(v => !v)}
                className="flex items-center justify-between w-full py-2 text-sm text-warning hover:text-warning/80 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  <span>Tidak bergerak 30 hari</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{data?.deadStockProducts.length} produk</span>
                  {showDeadStock ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </div>
              </button>
              {showDeadStock && (
                <ul className="mt-1 space-y-1 pl-6">
                  {data?.deadStockProducts.map((p: { id: string; name: string }) => (
                    <li key={p.id} className="text-xs text-gray-500">{p.name}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {(data?.deadStockProducts?.length ?? 0) === 0 && (
            <div className="flex items-center gap-2 text-success text-sm py-1">
              <TrendingDown className="h-4 w-4" />
              <span>Semua produk aktif terjual</span>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
