import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, deleteProduct } from '@/api/products'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { ProductForm } from './ProductForm'
import { RestockModal } from './RestockModal'
import { RestockHistoryModal } from './RestockHistoryModal'
import { Plus, Edit, Trash2, Search, ShoppingBag, RefreshCw, History } from 'lucide-react'
import { Product } from '@/types'

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [restockProduct, setRestockProduct] = useState<Product | null>(null)
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null)

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setDeleteConfirm(null)
    },
  })

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  const getTotalStock = (product: Product) =>
    product.sizes.reduce((sum, size) => sum + size.stock, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Produk</h2>
        <Button onClick={() => { setEditProduct(null); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <span className="text-sm text-gray-500">{filteredProducts.length} produk</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Tidak ada produk ditemukan</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Beli</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harga Jual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ukuran</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Stok</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                            <ShoppingBag className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.description && (
                            <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.sku || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-500">{formatPrice(product.purchasePrice)}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(product.sellingPrice)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {product.sizes.map(size => (
                          <Badge
                            key={size.id}
                            variant={size.stock === 0 ? 'danger' : size.stock < 5 ? 'warning' : 'default'}
                          >
                            {size.name}: {size.stock}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      <Badge variant={getTotalStock(product) === 0 ? 'danger' : 'default'}>
                        {getTotalStock(product)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{product.category?.name || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRestockProduct(product)}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                          title="Restock"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setHistoryProduct(product)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                          title="Riwayat Restock"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditProduct(product); setShowForm(true) }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(product.id)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditProduct(null) }} title={editProduct ? 'Edit Produk' : 'Tambah Produk'}>
        <ProductForm
          product={editProduct}
          onSuccess={() => { setShowForm(false); setEditProduct(null) }}
        />
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Produk">
        <div className="space-y-4">
          <p className="text-gray-600">Apakah Anda yakin ingin menghapus produk ini?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>

      <RestockModal product={restockProduct} onClose={() => setRestockProduct(null)} />
      <RestockHistoryModal product={historyProduct} onClose={() => setHistoryProduct(null)} />
    </div>
  )
}
