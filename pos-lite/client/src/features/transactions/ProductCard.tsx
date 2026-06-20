import { useState } from 'react'
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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null)

  const isExpired = product.expiryDate ? new Date(product.expiryDate) <= new Date() : false

  const uniqueVariantNames = [...new Set(product.sizes.map(s => s.variantName).filter(v => v !== ''))]
  const hasVariants = uniqueVariantNames.length > 0
  const uniqueSizeNames = [...new Set(product.sizes.map(s => s.name).filter(n => n !== 'Default'))]
  const hasSizes = uniqueSizeNames.length > 0

  const handleVariantClick = (vn: string) => {
    if (!hasSizes) {
      // Only variants, no custom sizes — Default entry per variant, add directly
      const size = product.sizes.find(s => s.variantName === vn && s.name === 'Default')
      if (size && size.stock > 0) onAddToCart(product, size)
    } else {
      setSelectedVariant(vn)
    }
  }

  const handleSizeClick = (size: ProductSize) => {
    if (size.stock === 0) return
    onAddToCart(product, size)
    if (hasVariants) setSelectedVariant(null)
  }

  // Sizes to display after a variant is picked (or all sizes if no variants)
  const displaySizes = selectedVariant !== null
    ? product.sizes.filter(s => s.variantName === selectedVariant)
    : !hasVariants
      ? product.sizes
      : []

  return (
    <Card className={clsx('overflow-hidden hover:shadow-md transition-shadow', isExpired && 'opacity-70')}>
      <div className="aspect-square bg-gray-100 relative">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="h-12 w-12 text-gray-300" />
          </div>
        )}
        {isExpired && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-red-600 text-white text-xs rounded font-medium">
            Kadaluarsa
          </div>
        )}
      </div>

      <div className="p-3">
        <h3 className="font-medium text-gray-800 truncate text-sm">{product.name}</h3>
        <p className="text-primary font-bold text-sm mt-1">{formatPrice(product.sellingPrice)}</p>

        {isExpired ? (
          <p className="text-xs text-red-500 mt-2">Tidak bisa dijual</p>
        ) : (
          <div className="mt-2">
            {/* Step 1: Variant chips (if product has variants and none selected yet) */}
            {hasVariants && selectedVariant === null && (
              <>
                <p className="text-xs text-gray-400 mb-1">{product.variantLabel || 'Pilih Varian'}:</p>
                <div className="flex flex-wrap gap-1">
                  {uniqueVariantNames.map(vn => {
                    const variantStock = product.sizes
                      .filter(s => s.variantName === vn)
                      .reduce((sum, s) => sum + s.stock, 0)
                    return (
                      <button
                        key={vn}
                        onClick={() => handleVariantClick(vn)}
                        disabled={variantStock === 0}
                        className={clsx(
                          'px-2 py-2 text-xs rounded border transition-colors',
                          variantStock === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-primary text-primary hover:bg-primary hover:text-white'
                        )}
                      >
                        {vn} ({variantStock})
                      </button>
                    )
                  })}
                </div>
              </>
            )}

            {/* Step 2: Size chips (after variant selected, or directly if no variants) */}
            {(selectedVariant !== null || !hasVariants) && (
              <>
                {selectedVariant !== null && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-xs text-indigo-600 font-medium">{selectedVariant}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedVariant(null)}
                      className="px-2 py-1 text-sm text-gray-400 hover:text-gray-600 leading-none"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {displaySizes.map(size => {
                    const label = size.name !== 'Default' ? size.name : (!hasVariants ? 'Tambah' : '✓')
                    return (
                      <button
                        key={size.id}
                        onClick={() => handleSizeClick(size)}
                        disabled={size.stock === 0}
                        className={clsx(
                          'px-2 py-2 text-xs rounded border transition-colors touch-target',
                          size.stock === 0
                            ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                            : 'border-primary text-primary hover:bg-primary hover:text-white active:bg-primary-700'
                        )}
                      >
                        {label} ({size.stock})
                      </button>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}
