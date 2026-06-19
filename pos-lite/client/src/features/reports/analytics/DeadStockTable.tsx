import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getDeadStock } from '@/api/reports'
import { Spinner } from '@/components/ui/Spinner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'

export function DeadStockTable({ period: _period }: { period: number }) {
  const [threshold, setThreshold] = useState(30)

  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'dead-stock', threshold],
    queryFn: () => getDeadStock(threshold),
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-700">Dead Stock / Slow Moving</p>
          <p className="text-xs text-gray-400">Produk masih ada stok tapi tidak terjual</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Tidak terjual dalam:</span>
          {[30, 60, 90].map(t => (
            <button
              key={t}
              onClick={() => setThreshold(t)}
              className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                threshold === t
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}H
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">
          Tidak ada produk yang stagnan dalam {threshold} hari terakhir 🎉
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stok</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Terakhir Terjual</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Hari Stagnan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(row => {
                const isCritical = row.daysSinceLastSale === null || row.daysSinceLastSale >= 60
                return (
                  <tr key={row.productId} className={isCritical ? 'bg-red-50' : ''}>
                    <td className="px-3 py-2 font-medium text-gray-800">{row.productName}</td>
                    <td className="px-3 py-2 text-gray-500">{row.categoryName}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{row.currentStock}</td>
                    <td className="px-3 py-2 text-right text-gray-500">
                      {row.lastSoldAt
                        ? format(new Date(row.lastSoldAt), 'dd MMM yyyy', { locale: id })
                        : <span className="text-red-500 font-medium">Belum pernah</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {row.daysSinceLastSale !== null ? (
                        <span className={`font-semibold ${isCritical ? 'text-red-600' : 'text-orange-500'}`}>
                          {row.daysSinceLastSale} hari
                        </span>
                      ) : (
                        <span className="text-red-600 font-semibold">—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="text-xs text-gray-400 mt-2 px-1">* Baris merah: stagnan ≥60 hari atau belum pernah terjual</p>
        </div>
      )}
    </div>
  )
}
