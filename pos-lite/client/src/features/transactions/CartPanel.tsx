import { CartItem } from '@/types'
import { Button } from '@/components/ui/Button'
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'

interface CartPanelProps {
  items: CartItem[]
  total: number
  notes: string
  onNotesChange: (notes: string) => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onCheckout: () => void
  isSubmitting?: boolean
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

export function CartPanel({
  items,
  total,
  notes,
  onNotesChange,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isSubmitting,
}: CartPanelProps) {
  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-gray-800">Keranjang</h3>
          <span className="text-sm text-gray-500">({items.length} item)</span>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">Belum ada item</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.productName} className="w-12 h-12 rounded object-cover" />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-800 truncate">{item.productName}</p>
                <p className="text-xs text-gray-500">Ukuran: {item.size}</p>
                <p className="text-sm font-medium text-primary mt-1">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                >
                  <Plus className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="w-7 h-7 rounded flex items-center justify-center text-danger hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 border-t border-gray-200 space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={2}
            placeholder="Catatan transaksi..."
          />
        </div>

        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>

        <Button
          className="w-full"
          size="lg"
          isLoading={isSubmitting}
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          💳 Bayar
        </Button>
      </div>
    </div>
  )
}
