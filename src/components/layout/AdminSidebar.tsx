'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { EmployeeRole } from '@/lib/types/database'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  ClipboardList,
  CalendarOff,
  Banknote,
  Settings,
  LogOut,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Menu,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface AdminSidebarProps {
  userName: string
  userRole: EmployeeRole
  outletName?: string
}

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/outlets', label: 'Outlets', icon: Building2 },
  { href: '/admin/employees', label: 'Employees', icon: Users },
  { href: '/admin/attendance', label: 'Attendance', icon: ClipboardList },
  { href: '/admin/leave', label: 'Leave', icon: CalendarOff },
  { href: '/admin/payroll', label: 'Payroll', icon: Banknote },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminSidebar({ userName, userRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className={cn('flex items-center gap-3 px-4 py-5 border-b border-[#334155]', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="text-sm font-bold text-white tracking-tight">GeoAttend</span>
            <p className="text-[10px] text-slate-500 leading-none mt-0.5">Workforce Platform</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        {adminNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn('nav-item', isActive && 'active', collapsed && 'justify-center px-2')}
              title={collapsed ? label : undefined}
            >
              <Icon className="nav-icon" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className={cn('border-t border-[#334155] p-3', collapsed && 'flex flex-col items-center')}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 px-1 mb-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-accent">
                {userName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{userName}</p>
              <StatusBadge variant={userRole} size="sm" showDot={false} />
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium',
            'text-slate-400 hover:text-danger hover:bg-danger/10 transition-all',
            collapsed && 'justify-center px-2'
          )}
          title="Sign out"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{isLoggingOut ? 'Signing out…' : 'Sign out'}</span>}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-[#1E293B] border-r border-[#334155]',
          'transition-all duration-200 ease-in-out flex-shrink-0',
          collapsed ? 'w-16' : 'w-64'
        )}
      >
        <NavContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-[72px] translate-x-1/2 w-6 h-6 bg-[#334155] border border-[#475569] rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Mobile: hamburger button in header is handled by MobileHeader */}
      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-[#1E293B] border-r border-[#334155] flex flex-col animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center h-14 px-4 bg-[#1E293B] border-b border-[#334155]">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#334155] transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 ml-3">
          <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-white">GeoAttend</span>
        </div>
        <div className="ml-auto">
          <div className="w-8 h-8 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-accent">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
