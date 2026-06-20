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

type ExpiryStatus = 'expired' | 'soon' | 'warning' | 'ok' | 'none'

function getExpiryStatus(expiryDate: string | null | undefined): ExpiryStatus {
  if (!expiryDate) return 'none'
  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / 86400000)
  if (daysLeft <= 0) return 'expired'
  if (daysLeft <= 7) return 'soon'
  if (daysLeft <= 30) return 'warning'
  return 'ok'
}

function ExpiryBadge({ expiryDate }: { expiryDate: string | null | undefined }) {
  const status = getExpiryStatus(expiryDate)
  if (status === 'none') return <span className="text-gray-400 text-xs">-</span>

  const dateStr = new Date(expiryDate!).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  const config: Record<Exclude<ExpiryStatus, 'none'>, { cls: string; prefix: string }> = {
    expired: { cls: 'bg-red-100 text-red-700', prefix: 'Kadaluarsa ' },
    soon:    { cls: 'bg-rose-100 text-rose-700', prefix: '≤7H ' },
    warning: { cls: 'bg-yellow-100 text-yellow-700', prefix: '' },
    ok:      { cls: 'bg-green-50 text-green-700', prefix: '' },
  }
  const { cls, prefix } = config[status]
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-medium ${cls}`}>
      {prefix}{dateStr}
    </span>
  )
}

type FilterType = 'all' | 'expiring' | 'expired' | 'oos'

export function ProductsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
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

  const getTotalStock = (p: Product) => p.sizes.reduce((sum, s) => sum + s.stock, 0)

  const getOosStatus = (p: Product): 'none' | 'partial' | 'full' => {
    if (p.sizes.length === 0) return 'none'
    const allZero = p.sizes.every(s => s.stock === 0)
    if (allZero) return 'full'
    const anyZero = p.sizes.some(s => s.stock === 0)
    return anyZero ? 'partial' : 'none'
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku?.toLowerCase().includes(search.toLowerCase()) ?? false)
    if (!matchSearch) return false
    if (filter === 'oos') return getOosStatus(p) === 'full'
    if (filter === 'expired') return getExpiryStatus(p.expiryDate) === 'expired'
    if (filter === 'expiring') {
      const s = getExpiryStatus(p.expiryDate)
      return s === 'soon' || s === 'warning'
    }
    return true
  })

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  const getSizesLabel = (p: Product) => {
    const unique = [...new Set(p.sizes.map(s => s.name).filter(n => n !== 'Default'))]
    if (unique.length === 0) return p.sizes.length > 0 ? 'Default' : '-'
    if (unique.length === 1) return unique[0]
    return `${unique.length} ukuran`
  }

  const getVariantChips = (p: Product) => {
    return [...new Set(p.sizes.map(s => s.variantName).filter(v => v !== ''))]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Produk</h2>
        <Button onClick={() => { setEditProduct(null); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Produk
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as FilterType)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="all">Semua</option>
          <option value="expiring">Hampir Kadaluarsa</option>
          <option value="expired">Kadaluarsa</option>
          <option value="oos">Stok Habis</option>
        </select>
        <span className="text-sm text-gray-500">{filteredProducts.length} produk</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">SKU</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Harga Beli</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Harga Jual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Varian</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Ukuran</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stok</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Berat</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Kadaluarsa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Kategori</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const variantChips = getVariantChips(product)
                  const oos = getOosStatus(product)
                  return (
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
                              <div className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{product.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{product.sku || '-'}</td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500 hidden md:table-cell">{formatPrice(product.purchasePrice)}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium hidden md:table-cell">{formatPrice(product.sellingPrice)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {variantChips.length === 0 ? (
                          <span className="text-gray-400 text-xs">-</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {variantChips.slice(0, 3).map(v => (
                              <span key={v} className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">{v}</span>
                            ))}
                            {variantChips.length > 3 && (
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">+{variantChips.length - 3}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">{getSizesLabel(product)}</td>
                      <td className="px-4 py-3 text-sm text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <Badge variant={oos === 'full' ? 'danger' : 'default'}>
                            {getTotalStock(product)}
                          </Badge>
                          {oos === 'full' && <span className="text-xs text-red-600 font-medium">Habis</span>}
                          {oos === 'partial' && <span className="text-xs text-yellow-600">Sebagian Habis</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                        {product.weight != null ? `${product.weight} ${product.weightUnit || ''}` : '-'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <ExpiryBadge expiryDate={product.expiryDate} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">{product.category?.name || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setRestockProduct(product)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Restock">
                            <RefreshCw className="h-4 w-4" />
                          </button>
                          <button onClick={() => setHistoryProduct(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="Riwayat Restock">
                            <History className="h-4 w-4" />
                          </button>
                          <Button variant="ghost" size="sm" onClick={() => { setEditProduct(product); setShowForm(true) }}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(product.id)}>
                            <Trash2 className="h-4 w-4 text-danger" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal isOpen={showForm} onClose={() => { setShowForm(false); setEditProduct(null) }} title={editProduct ? 'Edit Produk' : 'Tambah Produk'}>
        <ProductForm product={editProduct} onSuccess={() => { setShowForm(false); setEditProduct(null) }} />
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Hapus Produk">
        <div className="space-y-4">
          <p className="text-gray-600">Apakah Anda yakin ingin menghapus produk ini?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Batal</Button>
            <Button variant="danger" isLoading={deleteMutation.isPending} onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}>
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
