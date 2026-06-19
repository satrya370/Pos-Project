import { ShoppingCart } from 'lucide-react'

interface CartBadgeProps {
  count: number
  onClick: () => void
}

export function CartBadge({ count, onClick }: CartBadgeProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 lg:hidden"
    >
      <ShoppingCart className="h-6 w-6 text-gray-600" />
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-danger text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
}
