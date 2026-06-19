import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useDailyTarget, useUpdateDailyTarget } from '@/hooks/useApi'
import { Target, Pencil, X, Check } from 'lucide-react'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(price)

interface DailyTargetCardProps {
  todaySales: number
}

export function DailyTargetCard({ todaySales }: DailyTargetCardProps) {
  const { data } = useDailyTarget()
  const { mutate: saveTarget, isPending } = useUpdateDailyTarget()
  const [editing, setEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')

  const target = data?.dailyTarget ?? 0
  const progress = target > 0 ? (todaySales / target) * 100 : 0
  const remaining = Math.max(0, target - todaySales)

  function handleStartEdit() {
    setInputValue(target > 0 ? String(target) : '')
    setEditing(true)
  }

  function handleSave() {
    const val = parseInt(inputValue.replace(/\D/g, ''), 10)
    if (!isNaN(val) && val >= 0) {
      saveTarget(val, { onSuccess: () => setEditing(false) })
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-gray-800">Target Harian</h3>
        </div>
        {!editing && (
          <button onClick={handleStartEdit} className="text-gray-400 hover:text-gray-600 transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="text-xs text-gray-500">Target penjualan (Rp)</label>
          <div className="flex gap-2">
            <input
              type="number"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="contoh: 1000000"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={isPending}
              className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => setEditing(false)}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      ) : target === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">Belum ada target harian</p>
          <button
            onClick={handleStartEdit}
            className="text-sm text-primary hover:underline"
          >
            Set target sekarang →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <ProgressBar value={progress} />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatPrice(todaySales)}</span>
            <span>{formatPrice(target)}</span>
          </div>
          {progress >= 100 ? (
            <p className="text-xs text-success font-medium text-center">Target tercapai!</p>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              Kurang {formatPrice(remaining)} ({Math.round(progress)}% tercapai)
            </p>
          )}
        </div>
      )}
    </Card>
  )
}
