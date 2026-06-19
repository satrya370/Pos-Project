import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts } from '@/api/products'
import { createTransaction } from '@/api/transactions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'

interface CartItem {
  productId: string
  productName: string
  price: number
  quantity: number
}

export function RecordSalePage() {
  const queryClient = useQueryClient()
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      setCart([])
      setNotes('')
      alert('Penjualan berhasil dicatat!')
    },
    onError: (error: Error) => {
      alert(`Gagal mencatat penjualan: ${error.message}`)
    },
  })

  const selectedProduct = products.find((p) => p.id === selectedProductId)

  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) return

    const existing = cart.find((item) => item.productId === selectedProduct.id)
    if (existing) {
      setCart(cart.map((item) =>
        item.productId === selectedProduct.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ))
    } else {
      setCart([
        ...cart,
        {
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          price: selectedProduct.sellingPrice,
          quantity,
        },
      ])
    }

    setSelectedProductId('')
    setQuantity(1)
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const handleSubmit = () => {
    if (cart.length === 0) return

    createMutation.mutate({
      items: cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
      notes: notes || null,
    })
  }

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

  if (isLoadingProducts) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Catat Penjualan</h2>

      <Card className="p-6">
        <div className="flex items-end gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Produk</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Pilih produk...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id} disabled={product.stock <= 0}>
                  {product.name} - {formatPrice(product.sellingPrice)} (Stok: {product.stock})
                </option>
              ))}
            </select>
          </div>
          <div className="w-24">
            <label className="block text-sm font-medium text-gray-700 mb-1">Qty</label>
            <Input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
          </div>
          <Button onClick={addToCart} disabled={!selectedProductId}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah
          </Button>
        </div>

        {cart.length > 0 ? (
          <>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Harga</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {cart.map((item) => (
                    <tr key={item.productId}>
                      <td className="px-4 py-3 text-sm font-medium">{item.productName}</td>
                      <td className="px-4 py-3 text-sm text-right">{formatPrice(item.price)}</td>
                      <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(item.price * item.quantity)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => removeFromCart(item.productId)}>
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                rows={2}
                placeholder="Catatan transaksi..."
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              isLoading={createMutation.isPending}
              onClick={handleSubmit}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Catat Penjualan
            </Button>
          </>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Belum ada item di keranjang</p>
          </div>
        )}
      </Card>
    </div>
  )
}
