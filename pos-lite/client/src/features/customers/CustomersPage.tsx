import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import {
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerById,
} from '@/api/customers'
import type { CreateCustomerInput, CustomerDetail } from '@/api/customers'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import type { Customer } from '@/types'
import { Plus, Edit, Trash2, Eye, Users, Search } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

const formatRp = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n)

export function CustomersPage() {
  const queryClient = useQueryClient()

  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [detailCustomer, setDetailCustomer] = useState<string | null>(null)

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: customers = [], isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => getCustomers(search || undefined),
  })

  const { data: customerDetail, isLoading: isDetailLoading } = useQuery<CustomerDetail>({
    queryKey: ['customers', detailCustomer],
    queryFn: () => getCustomerById(detailCustomer!),
    enabled: !!detailCustomer,
  })

  // ── Form ─────────────────────────────────────────────────────────────────
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateCustomerInput>({
    defaultValues: { name: '', phone: '', email: '', notes: '' },
  })

  // ── Mutations ─────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      handleCloseForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: CreateCustomerInput) => updateCustomer(editCustomer!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      handleCloseForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] })
      setDeleteConfirm(null)
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditCustomer(null)
    reset({ name: '', phone: '', email: '', notes: '' })
    setShowForm(true)
  }

  const handleOpenEdit = (customer: Customer) => {
    setEditCustomer(customer)
    reset({
      name: customer.name,
      phone: customer.phone ?? '',
      email: customer.email ?? '',
      notes: customer.notes ?? '',
    })
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditCustomer(null)
    reset({ name: '', phone: '', email: '', notes: '' })
  }

  const onSubmit = (data: CreateCustomerInput) => {
    const payload: CreateCustomerInput = {
      name: data.name,
      phone: data.phone || null,
      email: data.email || null,
      notes: data.notes || null,
    }
    if (editCustomer) {
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
      alert(err.message || 'Gagal menghapus customer')
    }
  }

  const isFormLoading = createMutation.isPending || updateMutation.isPending

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Customer</h2>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Customer
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari customer..."
          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : customers.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">
            {search
              ? 'Tidak ada customer yang cocok dengan pencarian.'
              : 'Belum ada customer. Tambahkan customer pertama Anda.'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Nama
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Telepon
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetailCustomer(customer.id)}
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(customer)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(customer.id)}
                          title="Hapus"
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
        title={editCustomer ? 'Edit Customer' : 'Tambah Customer'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama <span className="text-danger">*</span>
            </label>
            <input
              {...register('name', { required: 'Nama wajib diisi' })}
              placeholder="Nama customer"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-danger">{errors.name.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telepon</label>
            <input
              {...register('phone')}
              placeholder="Nomor telepon (opsional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="Alamat email (opsional)"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Catatan</label>
            <textarea
              {...register('notes')}
              placeholder="Catatan customer (opsional)"
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button type="button" variant="secondary" onClick={handleCloseForm}>
              Batal
            </Button>
            <Button type="submit" isLoading={isFormLoading}>
              {editCustomer ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Hapus Customer"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Apakah Anda yakin ingin menghapus customer ini?</p>
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

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        title="Detail Customer"
        className="max-w-2xl"
      >
        {isDetailLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : customerDetail ? (
          <div className="space-y-5">
            {/* Customer info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 mb-0.5">Nama</p>
                <p className="font-medium text-gray-900">{customerDetail.name}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Telepon</p>
                <p className="font-medium text-gray-900">{customerDetail.phone || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">Email</p>
                <p className="font-medium text-gray-900">{customerDetail.email || '-'}</p>
              </div>
              {customerDetail.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500 mb-0.5">Catatan</p>
                  <p className="font-medium text-gray-900">{customerDetail.notes}</p>
                </div>
              )}
            </div>

            {/* Transaction history */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Riwayat Transaksi ({customerDetail.transactions.length})
              </h4>
              {customerDetail.transactions.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  Belum ada transaksi untuk customer ini.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Invoice
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Tanggal
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {customerDetail.transactions.map((tx) => {
                        const paymentBadge =
                          tx.paymentStatus === 'credit'
                            ? { variant: 'warning' as const, label: 'Kredit' }
                            : { variant: 'success' as const, label: 'Lunas' }

                        const isVoided = tx.status === 'voided'

                        return (
                          <tr key={tx.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2 font-mono text-gray-800">
                              {tx.invoiceNumber}
                            </td>
                            <td className="px-3 py-2 text-gray-600">
                              {format(new Date(tx.createdAt), 'd MMM yyyy', {
                                locale: idLocale,
                              })}
                            </td>
                            <td className="px-3 py-2 text-right text-gray-900 font-medium">
                              {formatRp(tx.totalAmount)}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <div className="flex items-center justify-center gap-1 flex-wrap">
                                {isVoided ? (
                                  <Badge variant="danger">Void</Badge>
                                ) : (
                                  <Badge variant={paymentBadge.variant}>
                                    {paymentBadge.label}
                                  </Badge>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t">
              <Button variant="secondary" onClick={() => setDetailCustomer(null)}>
                Tutup
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
