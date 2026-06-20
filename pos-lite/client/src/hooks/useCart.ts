import { useState, useCallback, useMemo } from 'react'
import { CartItem, Product, ProductSize } from '@/types'

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])

  const addItem = useCallback((product: Product, size: ProductSize) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.productId === product.id && i.productSizeId === size.id
      )
      if (existing) {
        return prev.map(i =>
          i.id === existing.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      const sizeParts = []
      if (size.variantName) sizeParts.push(size.variantName)
      if (size.name !== 'Default') sizeParts.push(size.name)
      return [...prev, {
        id: `${product.id}-${size.id}`,
        productId: product.id,
        productSizeId: size.id,
        productName: product.name,
        size: sizeParts.join(' / ') || 'Default',
        price: product.sellingPrice,
        quantity: 1,
        discountPercent: 0,
        imageUrl: product.imageUrl,
      }]
    })
  }, [])

  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.id !== itemId))
      return
    }
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, quantity } : i)
    )
  }, [])

  const setDiscount = useCallback((itemId: string, discountPercent: number) => {
    const clamped = Math.min(100, Math.max(0, discountPercent))
    setItems(prev =>
      prev.map(i => i.id === itemId ? { ...i, discountPercent: clamped } : i)
    )
  }, [])

  const removeItem = useCallback((itemId: string) => {
    setItems(prev => prev.filter(i => i.id !== itemId))
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const totalItems = useMemo(() =>
    items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  )

  const totalPrice = useMemo(() =>
    items.reduce((sum, item) => {
      const discounted = item.price * item.quantity * (1 - item.discountPercent / 100)
      return sum + discounted
    }, 0),
    [items]
  )

  return {
    items,
    totalItems,
    totalPrice,
    addItem,
    updateQuantity,
    setDiscount,
    removeItem,
    clearCart,
  }
}
