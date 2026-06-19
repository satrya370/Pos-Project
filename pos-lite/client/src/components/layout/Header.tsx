import { useAuth } from '@/features/auth/useAuth'
import { User } from 'lucide-react'

export function Header() {
  const { owner } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-lg font-semibold text-gray-800">PosLite</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <User className="h-4 w-4" />
          <span>{owner?.name || 'User'}</span>
        </div>
      </div>
    </header>
  )
}
