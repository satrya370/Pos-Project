import { NavLink } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Clock,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '@/features/auth/useAuth'

interface SidebarProps {
  isExpanded: boolean
  onToggle: () => void
}

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Produk' },
  { to: '/transactions', icon: ShoppingCart, label: 'Catat Penjualan' },
  { to: '/transactions/history', icon: Clock, label: 'Riwayat' },
  { to: '/reports', icon: BarChart3, label: 'Laporan' },
]

export function Sidebar({ isExpanded, onToggle }: SidebarProps) {
  const { owner, logout } = useAuth()

  return (
    <aside
      className={clsx(
        'h-screen bg-gray-900 text-white flex flex-col transition-all duration-300',
        isExpanded ? 'w-64' : 'w-20'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isExpanded && (
          <span className="text-xl font-bold text-primary">PosLite</span>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          {isExpanded ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="font-medium">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User Info + Logout */}
      <div className="p-4 border-t border-gray-700">
        {isExpanded && owner && (
          <div className="mb-3 px-3">
            <p className="text-sm font-medium text-white truncate">{owner.name}</p>
            <p className="text-xs text-gray-400 truncate">{owner.email}</p>
          </div>
        )}
        <button
          onClick={logout}
          className={clsx(
            'flex items-center gap-3 w-full px-3 py-2.5 rounded-lg',
            'text-gray-300 hover:bg-gray-700 hover:text-white transition-colors'
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isExpanded && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
