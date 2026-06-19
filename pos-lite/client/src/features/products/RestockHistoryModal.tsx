import { useQuery } from '@tanstack/react-query'
import { getRestockHistory } from '@/api/products'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Product, StockMovement } from '@/types'

interface RestockHistoryModalProps {
  product: Product | null
  onClose: () => void
}

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

export function RestockHistoryModal({ product, onClose }: RestockHistoryModalProps) {
  const { data: history = [], isLoading } = useQuery({
    queryKey: ['products', product?.id, 'restock-history'],
    queryFn: () => getRestockHistory(product!.id),
    enabled: !!product,
  })

  if (!product) return null

  return (
    <Modal
      isOpen={!!product}
      onClose={onClose}
      title={`Riwayat Restock — ${product.name}`}
      className="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="lg" />
        </div>
      ) : history.length === 0 ? (
        <p className="text-center text-gray-500 py-8">Belum ada riwayat restock</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">No. Nota</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(history as StockMovement[]).map((movement) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                    {format(new Date(movement.createdAt), 'dd MMM yyyy, HH:mm', { locale: id })}
                  </td>
                  <td className="px-3 py-2 text-right font-medium text-gray-900">
                    +{movement.quantity}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-600">
                    {movement.purchasePrice != null ? formatRp(movement.purchasePrice) : '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {movement.invoiceNumber ?? '-'}
                  </td>
                  <td className="px-3 py-2 text-gray-600">
                    {movement.notes ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
