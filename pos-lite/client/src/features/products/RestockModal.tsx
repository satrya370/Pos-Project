import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { restockSize, RestockInput } from '@/api/products'
import { getSuppliers } from '@/api/suppliers'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Product } from '@/types'

interface RestockModalProps {
  product: Product | null
  onClose: () => void
}

export function RestockModal({ product, onClose }: RestockModalProps) {
  const queryClient = useQueryClient()

  const [selectedSizeId, setSelectedSizeId] = useState<string>('')
  const [quantity, setQuantity] = useState<number>(1)
  const [purchasePrice, setPurchasePrice] = useState<string>('')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [supplierId, setSupplierId] = useState<string>('')
  const [notes, setNotes] = useState<string>('')

  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const mutation = useMutation({
    mutationFn: ({ sizeId, data }: { sizeId: string; data: RestockInput }) =>
      restockSize(product!.id, sizeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onClose()
    },
    onError: (error: Error) => {
      alert(error.message)
    },
  })

  if (!product) return null

  const effectiveSizeId = selectedSizeId || (product.sizes[0]?.id ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!effectiveSizeId) return

    const data: RestockInput = {
      quantity,
      purchasePrice: purchasePrice !== '' ? Number(purchasePrice) : null,
      invoiceNumber: invoiceNumber !== '' ? invoiceNumber : null,
      supplierId: supplierId !== '' ? supplierId : null,
      notes: notes !== '' ? notes : null,
    }

    mutation.mutate({ sizeId: effectiveSizeId, data })
  }

  return (
    <Modal isOpen={!!product} onClose={onClose} title={`Restock — ${product.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Size selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ukuran</label>
          <select
            value={effectiveSizeId}
            onChange={(e) => setSelectedSizeId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {product.sizes.map((size) => {
              const parts = []
              if (size.variantName) parts.push(size.variantName)
              if (size.name !== 'Default') parts.push(size.name)
              const label = parts.join(' / ') || 'Default'
              return (
                <option key={size.id} value={size.id}>
                  {label} (stok: {size.stock})
                </option>
              )
            })}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Jumlah <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Harga Beli */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga Beli</label>
          <input
            type="number"
            min={0}
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            placeholder="Harga beli per unit"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* No. Nota */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">No. Nota</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="Nomor nota/faktur"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Supplier */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
          <select
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Pilih Supplier --</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" isLoading={mutation.isPending}>
            Simpan Restock
          </Button>
        </div>
      </form>
    </Modal>
  )
}
