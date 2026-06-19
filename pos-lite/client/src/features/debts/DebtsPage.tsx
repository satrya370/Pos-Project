import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { getDebts, recordDebtPayment } from '@/api/transactions'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Spinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Transaction } from '@/types'
import { CreditCard, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface PayFormValues {
  amount: number
  notes: string
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

const getOutstanding = (t: Transaction) => {
  const paid = (t.debtPayments || []).reduce((s, p) => s + p.amount, 0)
  return t.totalAmount - paid
}

export function DebtsPage() {
  const queryClient = useQueryClient()
  const [showAll, setShowAll] = useState(false)
  const [payModal, setPayModal] = useState<Transaction | null>(null)

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: getDebts,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PayFormValues>()

  const payMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { amount: number; notes?: string | null } }) =>
      recordDebtPayment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] })
      setPayModal(null)
      reset()
    },
    onError: (error: Error) => {
      alert(`Gagal mencatat pembayaran: ${error.message}`)
    },
  })

  const totalOutstanding = debts.reduce((sum, t) => sum + getOutstanding(t), 0)

  const filtered = showAll ? debts : debts.filter(t => getOutstanding(t) > 0)

  const onSubmitPay = (values: PayFormValues) => {
    if (!payModal) return
    const outstanding = getOutstanding(payModal)
    if (values.amount <= 0 || values.amount > outstanding) return
    payMutation.mutate({
      id: payModal.id,
      data: {
        amount: Number(values.amount),
        notes: values.notes || null,
      },
    })
  }

  const openPayModal = (t: Transaction) => {
    setPayModal(t)
    reset({ amount: getOutstanding(t), notes: '' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <CreditCard className="h-7 w-7 text-primary" />
        <h2 className="text-2xl font-bold text-gray-800">Hutang / Kasbon</h2>
      </div>

      {/* Summary Card */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-yellow-100 rounded-xl">
            <CreditCard className="h-6 w-6 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Belum Lunas</p>
            <p className="text-2xl font-bold text-gray-800">{formatPrice(totalOutstanding)}</p>
          </div>
        </div>
      </Card>

      {/* Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAll(false)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !showAll
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Belum Lunas
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            showAll
              ? 'bg-primary text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Semua
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500">
            {showAll ? 'Tidak ada data hutang/kasbon' : 'Tidak ada hutang yang belum lunas'}
          </p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sudah Dibayar</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sisa</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((t) => {
                  const alreadyPaid = (t.debtPayments || []).reduce((s, p) => s + p.amount, 0)
                  const outstanding = getOutstanding(t)
                  return (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{t.invoiceNumber}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{t.customerName || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {format(new Date(t.createdAt), 'dd MMM yyyy', { locale: idLocale })}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium">{formatPrice(t.totalAmount)}</td>
                      <td className="px-4 py-3 text-sm text-right text-success">{formatPrice(alreadyPaid)}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-warning">
                        {formatPrice(outstanding)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {outstanding > 0 ? (
                          <Badge variant="warning">Belum Lunas</Badge>
                        ) : (
                          <Badge variant="success">Lunas</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={outstanding === 0}
                          onClick={() => openPayModal(t)}
                        >
                          Bayar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pay Modal */}
      <Modal
        isOpen={!!payModal}
        onClose={() => { setPayModal(null); reset() }}
        title="Catat Pembayaran Hutang"
      >
        {payModal && (
          <div className="space-y-4">
            {/* Info */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Invoice</span>
                <span className="font-mono font-medium">{payModal.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Pelanggan</span>
                <span>{payModal.customerName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Total Transaksi</span>
                <span className="font-medium">{formatPrice(payModal.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sudah Dibayar</span>
                <span className="text-success font-medium">
                  {formatPrice((payModal.debtPayments || []).reduce((s, p) => s + p.amount, 0))}
                </span>
              </div>
              <div className="flex justify-between border-t border-gray-200 pt-2">
                <span className="font-semibold text-gray-700">Sisa</span>
                <span className="font-bold text-warning">{formatPrice(getOutstanding(payModal))}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmitPay)} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Bayar</label>
                <input
                  type="number"
                  min={1}
                  max={getOutstanding(payModal)}
                  {...register('amount', {
                    required: 'Jumlah wajib diisi',
                    min: { value: 1, message: 'Jumlah harus lebih dari 0' },
                    max: {
                      value: getOutstanding(payModal),
                      message: `Jumlah tidak boleh melebihi sisa hutang`,
                    },
                    valueAsNumber: true,
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {errors.amount && (
                  <p className="text-xs text-danger mt-1">{errors.amount.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (opsional)</label>
                <input
                  type="text"
                  placeholder="Catatan pembayaran..."
                  {...register('notes')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => { setPayModal(null); reset() }}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  isLoading={payMutation.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Catat Pembayaran
                </Button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  )
}
