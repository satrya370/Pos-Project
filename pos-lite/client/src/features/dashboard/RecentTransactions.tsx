import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useTodayTransactions } from '@/hooks/useApi'
import { ShoppingBag, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

export function RecentTransactions() {
  const navigate = useNavigate()
  const { data: transactions = [], isLoading } = useTodayTransactions(5)

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Transaksi Hari Ini</h3>
        <button
          onClick={() => navigate('/transactions/history')}
          className="text-xs text-primary hover:underline"
        >
          Lihat semua
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium text-gray-500">Belum ada penjualan hari ini</p>
          <p className="text-xs mb-4">Yuk catat transaksi pertamamu!</p>
          <button
            onClick={() => navigate('/transactions')}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Catat Penjualan
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {transactions.map(t => (
            <li key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{t.invoiceNumber}</p>
                <p className="text-xs text-gray-400">{format(new Date(t.createdAt), 'HH:mm')} · {t.itemsCount} item</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-800">{formatPrice(t.totalAmount)}</span>
                {t.status === 'voided' && <Badge variant="danger">Void</Badge>}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
