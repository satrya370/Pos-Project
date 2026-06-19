import { useQuery } from '@tanstack/react-query'
import { getLowStockProducts } from '@/api/products'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { AlertTriangle } from 'lucide-react'

export function LowStockAlert() {
  const { data: lowStockProducts = [], isLoading } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: getLowStockProducts,
  })

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Spinner size="sm" />
          <span className="text-sm text-gray-500">Memuat data stok...</span>
        </div>
      </Card>
    )
  }

  if (lowStockProducts.length === 0) {
    return null
  }

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <h3 className="font-semibold text-gray-800">Stok Rendah</h3>
        <Badge variant="warning">{lowStockProducts.length}</Badge>
      </div>
      <ul className="space-y-2">
        {lowStockProducts.map((product) => (
          <li key={product.id} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{product.name}</span>
            <Badge variant="danger">{product.stock} unit</Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}
