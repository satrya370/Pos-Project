import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/api/categories'
import { CreateCategoryInput } from '@/api/categories'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Category } from '@/types'
import { Plus, Edit, Trash2, Tag } from 'lucide-react'

export function CategoriesPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editCategory, setEditCategory] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateCategoryInput>({
    defaultValues: {
      name: '',
      icon: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateCategoryInput) => updateCategory(editCategory!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      setDeleteConfirm(null)
    },
  })

  const handleOpenCreate = () => {
    setEditCategory(null)
    reset({ name: '', icon: '' })
    setShowForm(true)
  }

  const handleOpenEdit = (category: Category) => {
    setEditCategory(category)
    reset({
      name: category.name,
      icon: category.icon ?? '',
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditCategory(null)
    reset({ name: '', icon: '' })
  }

  const onSubmit = (data: CreateCategoryInput) => {
    const payload: CreateCategoryInput = {
      name: data.name,
      icon: data.icon || null,
    }
    if (editCategory) {
      updateMutation.mutate(payload)
    } else {
      createMutation.mutate(payload)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (error: unknown) {
      const err = error as { message?: string }
      alert(err.message || 'Gagal menghapus kategori')
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Kategori</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Kategori
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : categories.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Belum ada kategori. Tambahkan kategori pertama Anda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ikon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {category.icon ? (
                        <span className="text-xl">{category.icon}</span>
                      ) : (
                        <Tag className="h-5 w-5 text-gray-300" />
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{category.name}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(category.id)}
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

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={handleCloseForm}
        title={editCategory ? 'Edit Kategori' : 'Tambah Kategori'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama <span className="text-danger">*</span>
            </label>
            <input
              {...register('name', { required: 'Nama wajib diisi' })}
              placeholder="Nama kategori"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ikon</label>
            <input
              {...register('icon')}
              placeholder="Emoji atau teks, contoh: 👕"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <p className="mt-1 text-xs text-gray-400">Emoji atau teks singkat, contoh: 👕, 👟, Makanan</p>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseForm}>
              Batal
            </Button>
            <Button type="submit" isLoading={isFormLoading}>
              {editCategory ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Kategori"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Apakah Anda yakin ingin menghapus kategori ini?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
              Batal
            </Button>
            <Button
              variant="danger"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
