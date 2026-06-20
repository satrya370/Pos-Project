import { Button } from '@/components/ui/Button'
import { ShoppingCart } from 'lucide-react'

interface BottomCartBarProps {
  totalItems: number
  totalPrice: number
  onOpenCart: () => void
  onCheckout: () => void
  isSubmitting?: boolean
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

export function BottomCartBar({
  totalItems,
  totalPrice,
  onOpenCart,
  onCheckout,
  isSubmitting,
}: BottomCartBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden z-50">
      <div className="flex items-center justify-between">
        <button
          onClick={onOpenCart}
          className="flex items-center gap-2 px-3 py-3 rounded-lg hover:bg-gray-100 min-h-[44px]"
        >
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <span className="font-medium">{totalItems} items</span>
        </button>
        <div className="flex items-center gap-4">
          <span className="font-bold text-lg">{formatPrice(totalPrice)}</span>
          <Button
            onClick={onCheckout}
            disabled={totalItems === 0}
            isLoading={isSubmitting}
            className="min-h-[44px]"
          >
            Bayar
          </Button>
        </div>
      </div>
    </div>
  )
}
