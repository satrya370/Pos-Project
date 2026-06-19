import { useQuery } from '@tanstack/react-query'
import { getLowStockProducts } from '@/api/products'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { AlertTriangle, AlertCircle, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function LowStockAlert() {
  const navigate = useNavigate()
  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: getLowStockProducts,
  })

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <Spinner size="sm" />
          <span className="text-sm text-gray-500">Memuat data stok...</span>
        </div>
      </Card>
    )
  }

  const outOfStock = products.filter(p => p.sizes.some(s => s.stock === 0))
  const lowStock = products.filter(p =>
    p.sizes.some(s => s.stock > 0 && s.stock < p.minStockThreshold) &&
    !p.sizes.every(s => s.stock === 0)
  )

  if (outOfStock.length === 0 && lowStock.length === 0) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-success">
          <AlertTriangle className="h-4 w-4" />
          <p className="text-sm font-medium">Semua stok aman</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {outOfStock.length > 0 && (
        <Card className="p-4 border-danger/30 bg-danger/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-danger" />
              <h3 className="font-semibold text-gray-800">Stok Habis</h3>
              <Badge variant="danger">{outOfStock.length}</Badge>
            </div>
          </div>
          <ul className="space-y-2">
            {outOfStock.map(product => {
              const emptySize = product.sizes.filter(s => s.stock === 0)
              return (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {emptySize.map(s => (
                        <Badge key={s.id} variant="danger">{s.name}: 0</Badge>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(`/products`)}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}

      {lowStock.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h3 className="font-semibold text-gray-800">Stok Rendah</h3>
              <Badge variant="warning">{lowStock.length}</Badge>
            </div>
          </div>
          <ul className="space-y-2">
            {lowStock.map(product => {
              const warnSizes = product.sizes.filter(s => s.stock > 0 && s.stock < product.minStockThreshold)
              return (
                <li key={product.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 font-medium">{product.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex flex-wrap gap-1">
                      {warnSizes.map(s => (
                        <Badge key={s.id} variant="warning">{s.name}: {s.stock}</Badge>
                      ))}
                    </div>
                    <button
                      onClick={() => navigate(`/products`)}
                      className="text-primary hover:text-primary/80 transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
