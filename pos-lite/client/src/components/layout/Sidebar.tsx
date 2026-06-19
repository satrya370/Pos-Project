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
  Menu,
  X,
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
    <>
      {/* Mobile menu button */}
      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg lg:hidden hover:bg-gray-700 transition-colors"
      >
        {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Mobile overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'h-screen bg-gray-900 text-white flex flex-col transition-all duration-300 fixed lg:relative z-40',
          isExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:w-20 lg:translate-x-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          {isExpanded && (
            <span className="text-xl font-bold text-primary">PosLite</span>
          )}
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors hidden lg:block"
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
              onClick={() => {
                if (window.innerWidth < 1024) onToggle()
              }}
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
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User Info + Logout */}
        <div className="p-4 border-t border-gray-700">
          {owner && (
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
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
