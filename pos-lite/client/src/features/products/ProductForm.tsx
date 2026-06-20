import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import {
  createProduct, updateProduct, uploadProductImage, deleteProductImage, getProductById,
  addVariant as apiAddVariant, deleteVariant as apiDeleteVariant,
  addSizeName as apiAddSizeName, deleteSizeName as apiDeleteSizeName,
} from '@/api/products'
import { getSuppliers } from '@/api/suppliers'
import { getCategories } from '@/api/categories'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Product } from '@/types'
import { Plus, X, Image as ImageIcon } from 'lucide-react'

interface ProductFormProps {
  product?: Product | null
  onSuccess: () => void
}

interface ProductFormData {
  name: string
  sku: string
  description: string
  purchasePrice: number
  sellingPrice: number
  minStockThreshold: number
  categoryId: string
  supplierId: string
  weight: number | null
  weightUnit: string
  expiryDate: string
  variantLabel: string
}

function ChipRow({
  items,
  onAdd,
  onRemove,
  inputValue,
  onInputChange,
  placeholder,
  addLabel,
  isPending,
}: {
  items: string[]
  onAdd: () => void
  onRemove: (item: string) => void
  inputValue: string
  onInputChange: (v: string) => void
  placeholder: string
  addLabel: string
  isPending?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {items.map(item => (
        <span key={item} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
          {item}
          <button
            type="button"
            onClick={() => onRemove(item)}
            className="hover:text-red-500 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={inputValue}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
          placeholder={placeholder}
          className="px-2 py-1 border border-gray-300 rounded-full text-xs focus:outline-none focus:ring-1 focus:ring-primary w-32"
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={!inputValue.trim() || isPending}
          className="inline-flex items-center gap-0.5 px-2 py-1 text-xs text-primary border border-primary rounded-full hover:bg-primary hover:text-white disabled:opacity-40 transition-colors"
        >
          <Plus className="h-3 w-3" />
          {addLabel}
        </button>
      </div>
    </div>
  )
}

export function ProductForm({ product, onSuccess }: ProductFormProps) {
  const queryClient = useQueryClient()
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [addSizeInput, setAddSizeInput] = useState('')
  const [addVariantInput, setAddVariantInput] = useState('')
  const [localSizeNames, setLocalSizeNames] = useState<string[]>([])
  const [localVariantNames, setLocalVariantNames] = useState<string[]>([])

  const { data: freshProduct, refetch: refetchProduct } = useQuery({
    queryKey: ['product-detail', product?.id],
    queryFn: () => getProductById(product!.id),
    enabled: !!product,
    initialData: product ?? undefined,
    staleTime: 0,
  })

  const currentProduct = freshProduct ?? product
  const sizes = currentProduct?.sizes ?? []
  const uniqueSizeNames = [...new Set(sizes.map(s => s.name).filter(n => n !== 'Default'))]
  const uniqueVariantNames = [...new Set(sizes.map(s => s.variantName).filter(v => v !== ''))]

  const { data: suppliers = [] } = useQuery({ queryKey: ['suppliers'], queryFn: getSuppliers })
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<ProductFormData>({
    defaultValues: {
      name: '', sku: '', description: '', purchasePrice: 0, sellingPrice: 0,
      minStockThreshold: 5, categoryId: '', supplierId: '',
      weight: null, weightUnit: '', expiryDate: '', variantLabel: '',
    },
  })

  const variantLabelValue = watch('variantLabel')
  const showVariantSection = !!(variantLabelValue && variantLabelValue.trim())

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        sku: product.sku || '',
        description: product.description || '',
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        minStockThreshold: product.minStockThreshold,
        categoryId: product.categoryId || '',
        supplierId: product.supplierId || '',
        weight: product.weight ?? null,
        weightUnit: product.weightUnit || '',
        expiryDate: product.expiryDate ? product.expiryDate.split('T')[0] : '',
        variantLabel: product.variantLabel || '',
      })
      setImagePreview(product.imageUrl || null)
    } else {
      reset({ name: '', sku: '', description: '', purchasePrice: 0, sellingPrice: 0, minStockThreshold: 5, categoryId: '', supplierId: '', weight: null, weightUnit: '', expiryDate: '', variantLabel: '' })
      setLocalSizeNames([])
      setLocalVariantNames([])
      setImagePreview(null)
    }
  }, [product, reset])

  const createMutation = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      const sns = localSizeNames.filter(n => n.trim())
      const vns = localVariantNames.filter(v => v.trim())
      let sizesPayload: { name: string; variantName: string; stock: number }[] = []
      if (sns.length > 0 && vns.length > 0) {
        for (const sn of sns) for (const vn of vns) sizesPayload.push({ name: sn, variantName: vn, stock: 0 })
      } else if (sns.length > 0) {
        sizesPayload = sns.map(n => ({ name: n, variantName: '', stock: 0 }))
      } else if (vns.length > 0) {
        sizesPayload = vns.map(v => ({ name: 'Default', variantName: v, stock: 0 }))
      }
      return createProduct({
        ...formData,
        categoryId: formData.categoryId || null,
        supplierId: formData.supplierId || null,
        weight: formData.weight ?? null,
        weightUnit: (formData.weightUnit || null) as any,
        expiryDate: formData.expiryDate ? `${formData.expiryDate}T00:00:00.000Z` : null,
        variantLabel: formData.variantLabel?.trim() || null,
        sizes: sizesPayload,
      })
    },
    onSuccess: async (data) => {
      if (imageFile) await uploadProductImage(data.id, imageFile)
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (formData: ProductFormData) => {
      const updated = await updateProduct(product!.id, {
        ...formData,
        categoryId: formData.categoryId || null,
        supplierId: formData.supplierId || null,
        weight: formData.weight ?? null,
        weightUnit: (formData.weightUnit || null) as any,
        expiryDate: formData.expiryDate ? `${formData.expiryDate}T00:00:00.000Z` : null,
        variantLabel: formData.variantLabel?.trim() || null,
      })
      if (imageFile) await uploadProductImage(product!.id, imageFile)
      else if (!imagePreview && product!.imageUrl) await deleteProductImage(product!.id)
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      onSuccess()
    },
  })

  const addVariantMutation = useMutation({
    mutationFn: (vn: string) => apiAddVariant(product!.id, vn),
    onSuccess: () => { void refetchProduct(); setAddVariantInput('') },
    onError: (e: any) => alert(e.response?.data?.error || e.message),
  })
  const deleteVariantMutation = useMutation({
    mutationFn: (vn: string) => apiDeleteVariant(product!.id, vn),
    onSuccess: () => void refetchProduct(),
    onError: (e: any) => alert(e.response?.data?.error || e.message),
  })
  const addSizeNameMutation = useMutation({
    mutationFn: (sn: string) => apiAddSizeName(product!.id, sn),
    onSuccess: () => { void refetchProduct(); setAddSizeInput('') },
    onError: (e: any) => alert(e.response?.data?.error || e.message),
  })
  const deleteSizeNameMutation = useMutation({
    mutationFn: (sn: string) => apiDeleteSizeName(product!.id, sn),
    onSuccess: () => void refetchProduct(),
    onError: (e: any) => alert(e.response?.data?.error || e.message),
  })

  const onSubmit = (data: ProductFormData) => {
    if (product) updateMutation.mutate(data)
    else createMutation.mutate(data)
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

  const isLoading = createMutation.isPending || updateMutation.isPending
  const showGrid = !!product && uniqueSizeNames.length > 0 && uniqueVariantNames.length > 0
  const showIndividualTable = !!product && !showVariantSection && uniqueVariantNames.length === 0

  const getStockForCombo = (sizeName: string, variantName: string) =>
    sizes.find(s => s.name === sizeName && s.variantName === variantName)?.stock ?? 0

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[75vh] overflow-auto pr-1">
      {/* Image */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Gambar Produk</label>
        {imagePreview ? (
          <div className="relative inline-block max-w-full">
            <img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg border" />
            <button type="button" onClick={() => { setImageFile(null); setImagePreview(null) }} className="absolute -top-2 -right-2 bg-danger text-white rounded-full p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-32 h-32 max-w-full border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary">
            <ImageIcon className="h-8 w-8 text-gray-400" />
            <span className="text-xs text-gray-500 mt-1">Upload</span>
            <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
          </label>
        )}
      </div>

      <Input label="Nama Produk" placeholder="Masukkan nama produk" error={errors.name?.message} {...register('name', { required: 'Nama wajib diisi' })} />
      <Input label="SKU" placeholder="Masukkan SKU (opsional)" {...register('sku')} />
      <Input label="Deskripsi" placeholder="Deskripsi produk (opsional)" {...register('description')} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <Input label="Harga Beli" type="number" min={0} error={errors.purchasePrice?.message}
          {...register('purchasePrice', { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })} />
        <Input label="Harga Jual" type="number" min={0} error={errors.sellingPrice?.message}
          {...register('sellingPrice', { valueAsNumber: true, required: 'Harga jual wajib diisi', min: { value: 0, message: 'Minimal 0' } })} />
      </div>

      <Input label="Min Stok Threshold" type="number" min={0}
        {...register('minStockThreshold', { valueAsNumber: true, min: { value: 0, message: 'Minimal 0' } })} />

      {/* Berat */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Berat (opsional)</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={0}
            step="any"
            placeholder="Contoh: 500"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            {...register('weight', { setValueAs: (v) => (v === '' || v == null) ? null : Number(v) })}
          />
          <select
            {...register('weightUnit')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">-- unit --</option>
            <option value="g">g</option>
            <option value="kg">kg</option>
            <option value="ml">ml</option>
            <option value="L">L</option>
            <option value="pcs">pcs</option>
          </select>
        </div>
      </div>

      {/* Kadaluarsa */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Kadaluarsa</label>
        <input
          type="date"
          {...register('expiryDate')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-gray-400 mt-0.5">Kosongkan jika tidak ada kadaluarsa</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Kategori</label>
        <select {...register('categoryId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">-- Tidak ada --</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ` : ''}{c.name}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Supplier</label>
        <select {...register('supplierId')} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">-- Tidak ada --</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}{s.phone ? ` (${s.phone})` : ''}</option>)}
        </select>
      </div>

      {/* Label Varian */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Label Varian (opsional)</label>
        <input
          type="text"
          placeholder="Contoh: Corak, Warna, Rasa..."
          {...register('variantLabel')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <p className="text-xs text-gray-400 mt-0.5">Label dimensi varian. Kosongkan jika tidak pakai varian.</p>
      </div>

      {/* ── Section A: Kelola Ukuran ── */}
      <div className="border border-gray-200 rounded-lg p-3 space-y-2">
        <label className="text-sm font-medium text-gray-700">Ukuran</label>
        {product ? (
          <ChipRow
            items={uniqueSizeNames}
            onAdd={() => { if (addSizeInput.trim()) addSizeNameMutation.mutate(addSizeInput.trim()) }}
            onRemove={(sn) => { if (confirm(`Hapus ukuran "${sn}"? Semua entri ukuran ini akan dihapus.`)) deleteSizeNameMutation.mutate(sn) }}
            inputValue={addSizeInput}
            onInputChange={setAddSizeInput}
            placeholder="Contoh: S, M, L"
            addLabel="Tambah Ukuran"
            isPending={addSizeNameMutation.isPending}
          />
        ) : (
          <ChipRow
            items={localSizeNames}
            onAdd={() => {
              const v = addSizeInput.trim()
              if (v && !localSizeNames.includes(v)) { setLocalSizeNames(p => [...p, v]); setAddSizeInput('') }
            }}
            onRemove={(sn) => setLocalSizeNames(p => p.filter(x => x !== sn))}
            inputValue={addSizeInput}
            onInputChange={setAddSizeInput}
            placeholder="Contoh: S, M, L"
            addLabel="Tambah Ukuran"
          />
        )}
        {(product ? uniqueSizeNames : localSizeNames).length === 0 && (
          <p className="text-xs text-gray-400">Kosong = satu ukuran default</p>
        )}
      </div>

      {/* ── Section B: Kelola Varian ── */}
      {showVariantSection && (
        <div className="border border-gray-200 rounded-lg p-3 space-y-2">
          <label className="text-sm font-medium text-gray-700">{variantLabelValue}</label>
          {product ? (
            <ChipRow
              items={uniqueVariantNames}
              onAdd={() => { if (addVariantInput.trim()) addVariantMutation.mutate(addVariantInput.trim()) }}
              onRemove={(vn) => { if (confirm(`Hapus varian "${vn}"? Semua entri varian ini akan dihapus.`)) deleteVariantMutation.mutate(vn) }}
              inputValue={addVariantInput}
              onInputChange={setAddVariantInput}
              placeholder="Nama varian..."
              addLabel="Tambah Varian"
              isPending={addVariantMutation.isPending}
            />
          ) : (
            <ChipRow
              items={localVariantNames}
              onAdd={() => {
                const v = addVariantInput.trim()
                if (v && !localVariantNames.includes(v)) { setLocalVariantNames(p => [...p, v]); setAddVariantInput('') }
              }}
              onRemove={(vn) => setLocalVariantNames(p => p.filter(x => x !== vn))}
              inputValue={addVariantInput}
              onInputChange={setAddVariantInput}
              placeholder="Nama varian..."
              addLabel="Tambah Varian"
            />
          )}
        </div>
      )}

      {/* ── Section C: Grid Preview ── */}
      {showGrid && (
        <div className="border border-gray-200 rounded-lg p-3 min-w-0">
          <p className="text-xs font-medium text-gray-500 mb-2">Preview Kombinasi (stok via Restock)</p>
          <div className="overflow-x-auto">
            <table className="text-xs w-auto">
              <thead>
                <tr>
                  <th className="px-2 py-1 text-gray-400 font-medium text-left">Ukuran</th>
                  {uniqueVariantNames.map(vn => (
                    <th key={vn} className="px-2 py-1 text-gray-600 font-medium text-center">{vn}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {uniqueSizeNames.map(sn => (
                  <tr key={sn}>
                    <td className="px-2 py-1 font-medium text-gray-700">{sn}</td>
                    {uniqueVariantNames.map(vn => {
                      const stock = getStockForCombo(sn, vn)
                      return (
                        <td key={vn} className="px-2 py-1 text-center">
                          {stock === 0
                            ? <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs">0</span>
                            : <span className="text-gray-700">{stock}</span>
                          }
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Section D: Individual sizes (simple products) ── */}
      {showIndividualTable && sizes.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Ukuran & Stok</p>
          <div className="space-y-1">
            {sizes.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="w-20 font-medium text-gray-700 truncate">{s.name}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.stock === 0 ? 'bg-red-100 text-red-600' : s.stock < 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                  {s.stock} unit
                </span>
                {s.sku && <span className="text-xs text-gray-400">SKU: {s.sku}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-4 px-1 border-t sticky bottom-0 bg-white">
        <Button type="button" variant="secondary" onClick={onSuccess}>Batal</Button>
        <Button type="submit" isLoading={isLoading}>{product ? 'Simpan' : 'Tambah'}</Button>
      </div>
    </form>
  )
}
