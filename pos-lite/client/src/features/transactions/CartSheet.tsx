import { CartItem } from '@/types'
import { X, ShoppingCart } from 'lucide-react'
import { CartPanel } from './CartPanel'

interface CartSheetProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  total: number
  notes: string
  onNotesChange: (notes: string) => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onSetDiscount: (itemId: string, discountPercent: number) => void
  paymentStatus: 'paid' | 'credit'
  customerName: string
  onPaymentStatusChange: (status: 'paid' | 'credit') => void
  onCustomerNameChange: (name: string) => void
  onCheckout: () => void
  isSubmitting?: boolean
}

export function CartSheet({
  isOpen,
  onClose,
  items,
  total,
  notes,
  onNotesChange,
  onUpdateQuantity,
  onRemoveItem,
  onSetDiscount,
  paymentStatus,
  customerName,
  onPaymentStatusChange,
  onCustomerNameChange,
  onCheckout,
  isSubmitting,
}: CartSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[90vh] overflow-hidden flex flex-col pb-4">
        <div className="flex justify-center p-2">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Keranjang ({items.length})</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <CartPanel
            items={items}
            total={total}
            notes={notes}
            onNotesChange={onNotesChange}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
            onSetDiscount={onSetDiscount}
            paymentStatus={paymentStatus}
            customerName={customerName}
            onPaymentStatusChange={onPaymentStatusChange}
            onCustomerNameChange={onCustomerNameChange}
            onCheckout={onCheckout}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  )
}
