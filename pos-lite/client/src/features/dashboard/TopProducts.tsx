import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { useTopProducts } from '@/hooks/useApi'
import { Trophy, AlertTriangle } from 'lucide-react'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

interface ProductListProps {
  title: string
  icon: React.ReactNode
  products: { productId: string; productName: string; quantity: number; revenue: number }[]
  variant: 'top' | 'bottom'
  isLoading?: boolean
}

function ProductList({ title, icon, products, variant, isLoading }: ProductListProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner size="md" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-4">Belum ada data</p>
      ) : (
        <ul className="space-y-3">
          {products.map((product, index) => (
            <li key={product.productId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Badge variant={variant === 'top' && index === 0 ? 'warning' : 'default'}>
                  {index + 1}
                </Badge>
                <span className="text-sm font-medium text-gray-700">{product.productName}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {product.quantity > 0 ? formatPrice(product.revenue) : <span className="text-gray-400">-</span>}
                </p>
                <p className="text-xs text-gray-500">{product.quantity} unit</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function TopProducts() {
  const { data: topProductsData, isLoading } = useTopProducts('30d')

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <ProductList
        title="Top Produk (30 hari)"
        icon={<Trophy className="h-5 w-5 text-warning" />}
        products={topProductsData?.top ?? []}
        variant="top"
        isLoading={isLoading}
      />
      <ProductList
        title="Perlu Perhatian (30 hari)"
        icon={<AlertTriangle className="h-5 w-5 text-danger" />}
        products={topProductsData?.bottom ?? []}
        variant="bottom"
        isLoading={isLoading}
      />
    </div>
  )
}
