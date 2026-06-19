import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '@/api/suppliers'
import { CreateSupplierInput } from '@/api/suppliers'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Supplier } from '@/types'
import { Plus, Edit, Trash2, Truck } from 'lucide-react'

export function SuppliersPage() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getSuppliers,
  })

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CreateSupplierInput>({
    defaultValues: {
      name: '',
      phone: '',
      contact: '',
      address: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateSupplierInput) => updateSupplier(editSupplier!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
      setDeleteConfirm(null)
    },
  })

  const handleOpenCreate = () => {
    setEditSupplier(null)
    reset({ name: '', phone: '', contact: '', address: '' })
    setShowForm(true)
  }

  const handleOpenEdit = (supplier: Supplier) => {
    setEditSupplier(supplier)
    reset({
      name: supplier.name,
      phone: supplier.phone ?? '',
      contact: supplier.contact ?? '',
      address: supplier.address ?? '',
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditSupplier(null)
    reset({ name: '', phone: '', contact: '', address: '' })
  }

  const onSubmit = (data: CreateSupplierInput) => {
    const payload: CreateSupplierInput = {
      name: data.name,
      phone: data.phone || null,
      contact: data.contact || null,
      address: data.address || null,
    }
    if (editSupplier) {
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
      alert(err.message || 'Gagal menghapus supplier')
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Supplier</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Supplier
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : suppliers.length === 0 ? (
        <Card className="p-12 text-center">
          <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">Belum ada supplier. Tambahkan supplier pertama Anda.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telepon</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alamat</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{supplier.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{supplier.contact || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate">{supplier.address || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(supplier.id)}
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
        title={editSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama <span className="text-danger">*</span>
            </label>
            <input
              {...register('name', { required: 'Nama wajib diisi' })}
              placeholder="Nama supplier"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input
              {...register('phone')}
              placeholder="Nomor telepon (opsional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <input
              {...register('contact')}
              placeholder="Nama kontak (opsional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
            <textarea
              {...register('address')}
              placeholder="Alamat supplier (opsional)"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseForm}>
              Batal
            </Button>
            <Button type="submit" isLoading={isFormLoading}>
              {editSupplier ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Supplier"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Apakah Anda yakin ingin menghapus supplier ini?</p>
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
