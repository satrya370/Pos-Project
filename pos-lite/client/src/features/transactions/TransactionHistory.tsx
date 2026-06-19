import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTransactions, voidTransaction } from '@/api/transactions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Eye, Ban, Search } from 'lucide-react'

export function TransactionHistory() {
  const queryClient = useQueryClient()
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [search, setSearch] = useState('')
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  const [voidConfirm, setVoidConfirm] = useState<string | null>(null)

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', startDate, endDate],
    queryFn: () => getTransactions(startDate || undefined, endDate || undefined),
  })

  const voidMutation = useMutation({
    mutationFn: voidTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      setVoidConfirm(null)
    },
  })

  const filteredTransactions = transactions.filter((t) =>
    t.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    t.notes?.toLowerCase().includes(search.toLowerCase())
  )

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  const selectedTx = transactions.find((t) => t.id === selectedTransaction)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Riwayat Transaksi</h2>

      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex-1 max-w-sm">
          <label className="block text-sm font-medium text-gray-700 mb-1">Cari</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <Button variant="secondary" onClick={() => { setStartDate(''); setEndDate(''); setSearch('') }}>
          Reset
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-500">Tidak ada transaksi ditemukan</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Items</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Profit</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono">{tx.invoiceNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {format(new Date(tx.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">{tx.itemsCount}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(tx.totalAmount)}</td>
                    <td className="px-4 py-3 text-sm text-right text-success">{formatPrice(tx.profit)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={tx.status === 'completed' ? 'success' : 'danger'}>
                        {tx.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedTransaction(tx.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {tx.status === 'completed' && (
                          <Button variant="ghost" size="sm" onClick={() => setVoidConfirm(tx.id)}>
                            <Ban className="h-4 w-4 text-danger" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={!!selectedTransaction} onClose={() => setSelectedTransaction(null)} title="Detail Transaksi">
        {selectedTx && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Invoice</span>
                <p className="font-mono font-medium">{selectedTx.invoiceNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Tanggal</span>
                <p>{format(new Date(selectedTx.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })}</p>
              </div>
              <div>
                <span className="text-gray-500">Total</span>
                <p className="font-bold">{formatPrice(selectedTx.totalAmount)}</p>
              </div>
              <div>
                <span className="text-gray-500">Profit</span>
                <p className="font-bold text-success">{formatPrice(selectedTx.profit)}</p>
              </div>
            </div>
            {selectedTx.notes && (
              <div>
                <span className="text-gray-500 text-sm">Catatan</span>
                <p className="text-sm mt-1">{selectedTx.notes}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Items</span>
              <ul className="mt-1 space-y-1">
                {selectedTx.items.map((item) => (
                  <li key={item.id} className="text-sm flex justify-between">
                    <span>{item.productName} x{item.quantity}</span>
                    <span>{formatPrice(item.subtotal)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!voidConfirm} onClose={() => setVoidConfirm(null)} title="Batalkan Transaksi">
        <div className="space-y-4">
          <p className="text-gray-600">Apakah Anda yakin ingin membatalkan transaksi ini? Stok produk akan dikembalikan.</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setVoidConfirm(null)}>Batal</Button>
            <Button
              variant="danger"
              isLoading={voidMutation.isPending}
              onClick={() => voidConfirm && voidMutation.mutate(voidConfirm)}
            >
              Batalkan Transaksi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
