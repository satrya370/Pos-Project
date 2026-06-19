import { Card } from '@/components/ui/Card'
import { Product, ProductSize } from '@/types'
import { clsx } from 'clsx'
import { ShoppingBag } from 'lucide-react'

interface ProductCardProps {
  product: Product
  onAddToCart: (product: Product, size: ProductSize) => void
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-medium text-gray-800 truncate text-sm">{product.name}</h3>
        <p className="text-primary font-bold text-sm mt-1">{formatPrice(product.sellingPrice)}</p>
        <div className="flex flex-wrap gap-1 mt-2">
          {product.sizes.map(size => (
            <button
              key={size.id}
              onClick={() => onAddToCart(product, size)}
              disabled={size.stock === 0}
              className={clsx(
                'px-2 py-1 text-xs rounded border transition-colors touch-target',
                size.stock === 0
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : 'border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-700'
              )}
            >
              {size.name} ({size.stock})
            </button>
          ))}
        </div>
      </div>
    </Card>
  )
}
