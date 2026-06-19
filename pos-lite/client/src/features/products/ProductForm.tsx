import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createProduct, updateProduct } from '@/api/products'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Product, CreateProductInput } from '@/types'

interface ProductFormProps {
  product?: Product | null
  onSuccess: () => void
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateProductInput>({
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      purchasePrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStockThreshold: 5,
    },
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        stock: product.stock,
        minStockThreshold: product.minStockThreshold,
      })
    } else {
      reset({
        name: '',
        sku: '',
        description: '',
        purchasePrice: 0,
        sellingPrice: 0,
        stock: 0,
        minStockThreshold: 5,
      })
    }
  }, [product, reset])

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateProductInput) => updateProduct(product!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const onSubmit = (data: CreateProductInput) => {
    if (product) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Nama Produk"
        placeholder="Masukkan nama produk"
        error={errors.name?.message}
        {...register('name', { required: 'Nama wajib diisi' })}
      />

      <Input
        label="SKU"
        placeholder="Masukkan SKU (opsional)"
        {...register('sku')}
      />

      <Input
        label="Deskripsi"
        placeholder="Deskripsi produk (opsional)"
        {...register('description')}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Harga Beli"
          type="number"
          min={0}
          error={errors.purchasePrice?.message}
          {...register('purchasePrice', { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })}
        />
        <Input
          label="Harga Jual"
          type="number"
          min={0}
          error={errors.sellingPrice?.message}
          {...register('sellingPrice', { valueAsNumber: true, required: 'Harga jual wajib diisi', min: { value: 0, message: 'Minimal 0' } })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Stok"
          type="number"
          min={0}
          {...register('stock', { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })}
        />
        <Input
          label="Min Stok Threshold"
          type="number"
          min={0}
          {...register('minStockThreshold', { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="secondary" onClick={onSuccess}>Batal</Button>
        <Button type="submit" isLoading={isLoading}>
          {product ? 'Simpan' : 'Tambah'}
        </Button>
      </div>
    </form>
  )
}
