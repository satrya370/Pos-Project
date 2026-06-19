import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { createProduct, updateProduct, uploadProductImage, deleteProductImage } from '@/api/products'
import { getSuppliers } from '@/api/suppliers'
import { getCategories } from '@/api/categories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Product, CreateProductInput } from '@/types'
import { Plus, Trash2, X, Image as ImageIcon } from 'lucide-react'

interface ProductFormProps {
  product?: Product | null
  onSuccess: () => void
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const queryClient = useQueryClient()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const { register, handleSubmit, formState: { errors }, reset, control } = useForm<CreateProductInput>({
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      purchasePrice: 0,
      sellingPrice: 0,
      minStockThreshold: 5,
      categoryId: null,
      supplierId: null,
      sizes: [{ name: '', stock: 0, sku: null }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'sizes',
  })

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        minStockThreshold: product.minStockThreshold,
        categoryId: product.categoryId || null,
        supplierId: product.supplierId || null,
        sizes: product.sizes.length > 0
          ? product.sizes.map(s => ({ name: s.name, stock: s.stock, sku: s.sku }))
          : [{ name: '', stock: 0, sku: null }],
      })
      setImagePreview(product.imageUrl || null)
    } else {
      reset({
        name: '',
        sku: '',
        description: '',
        purchasePrice: 0,
        sellingPrice: 0,
        minStockThreshold: 5,
        categoryId: null,
        supplierId: null,
        sizes: [{ name: '', stock: 0, sku: null }],
      })
      setImagePreview(null)
    }
  }, [product, reset])

  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: async (data) => {
      if (imageFile) {
        await uploadProductImage(data.id, imageFile)
      }
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const updated = await updateProduct(product!.id, data)
      if (imageFile) {
        await uploadProductImage(product!.id, imageFile)
      } else if (!imagePreview && product!.imageUrl) {
        await deleteProductImage(product!.id)
      }
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const onSubmit = (data: CreateProductInput) => {
    const filteredSizes = (data.sizes || []).filter(s => s.name.trim() !== '')
    const submitData = { ...data, sizes: filteredSizes }

    if (product) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-auto">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Produk</label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary">
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">Upload</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

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

      <Input
        label="Min Stok Threshold"
        type="number"
        min={0}
        {...register('minStockThreshold', { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })}
      />

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
        <select
          {...register('categoryId')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">-- Tidak ada --</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
        <select
          {...register('supplierId')}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">-- Tidak ada --</option>
          {suppliers.map(s => (
            <option key={s.id} value={s.id}>{s.name}{s.phone ? ` (${s.phone})` : ''}</option>
          ))}
        </select>
      </div>

      {/* Sizes */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Ukuran & Stok</label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => append({ name: '', stock: 0, sku: null })}
          >
            <Plus className="h-4 w-4 mr-1" />
            Tambah Ukuran
          </Button>
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                {...register(`sizes.${index}.name`, { required: 'Nama ukuran wajib diisi' })}
                placeholder="Nama (S, M, L, XL)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                {...register(`sizes.${index}.stock`, { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })}
                type="number"
                min={0}
                placeholder="Stok"
                className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="p-2 text-danger hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t sticky bottom-0 bg-white">
        <Button type="button" variant="secondary" onClick={onSuccess}>Batal</Button>
        <Button type="submit" isLoading={isLoading}>
          {product ? 'Simpan' : 'Tambah'}
        </Button>
      </div>
    </form>
  )
}
