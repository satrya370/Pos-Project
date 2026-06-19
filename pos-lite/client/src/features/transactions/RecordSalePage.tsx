import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts } from '@/api/products'
import { createTransaction } from '@/api/transactions'
import { useCart } from '@/hooks/useCart'
import { ProductCard } from './ProductCard'
import { CartPanel } from './CartPanel'
import { CartSheet } from './CartSheet'
import { BottomCartBar } from './BottomCartBar'
import { CartBadge } from './CartBadge'
import { Spinner } from '@/components/ui/Spinner'
import { Search, ShoppingBag } from 'lucide-react'

export function RecordSalePage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [notes, setNotes] = useState('')
  const [isCartOpen, setIsCartOpen] = useState(false)

  const {
    items,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart()

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      clearCart()
      setNotes('')
      setIsCartOpen(false)
      alert('Penjualan berhasil dicatat!')
    },
    onError: (error: Error) => {
      alert(`Gagal mencatat penjualan: ${error.message}`)
    },
  })

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCheckout = () => {
    if (items.length === 0) return

    createMutation.mutate({
      items: items.map(item => ({
        productId: item.productId,
        productSizeId: item.productSizeId,
        quantity: item.quantity,
      })),
      notes: notes || null,
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row">
      {/* Products Section */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-0">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <CartBadge count={totalItems} onClick={() => setIsCartOpen(true)} />
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Tidak ada produk ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addItem}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Desktop Cart Panel */}
      <div className="hidden lg:block w-80 xl:w-96 flex-shrink-0">
        <CartPanel
          items={items}
          total={totalPrice}
          notes={notes}
          onNotesChange={setNotes}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onCheckout={handleCheckout}
          isSubmitting={createMutation.isPending}
        />
      </div>

      {/* Mobile Bottom Cart Bar */}
      <BottomCartBar
        totalItems={totalItems}
        totalPrice={totalPrice}
        onOpenCart={() => setIsCartOpen(true)}
        onCheckout={handleCheckout}
        isSubmitting={createMutation.isPending}
      />

      {/* Mobile Cart Sheet */}
      <CartSheet
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={items}
        total={totalPrice}
        notes={notes}
        onNotesChange={setNotes}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeItem}
        onCheckout={handleCheckout}
        isSubmitting={createMutation.isPending}
      />
    </div>
  )
}
