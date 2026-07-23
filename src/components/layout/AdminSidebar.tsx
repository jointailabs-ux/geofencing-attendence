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
  KeyRound,
  Radio,
  Smartphone,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  color: string
}

interface AdminSidebarProps {
  userName: string
  userRole: EmployeeRole
  outletName?: string
}

const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#8B5CF6' },
  { href: '/admin/outlets', label: 'Outlets', icon: Building2, color: '#06B6D4' },
  { href: '/admin/employees', label: 'Employees', icon: Users, color: '#10B981' },
  { href: '/admin/manage-pins', label: 'Manage PINs', icon: KeyRound, color: '#EAB308' },
  { href: '/admin/attendance', label: 'Attendance', icon: ClipboardList, color: '#F59E0B' },
  { href: '/admin/leave', label: 'Leave', icon: CalendarOff, color: '#F43F5E' },
  { href: '/admin/payroll', label: 'Payroll', icon: Banknote, color: '#06B6D4' },
  { href: '/admin/live-tracking', label: 'Live Tracking', icon: Radio, color: '#F97316' },
  { href: '/admin/devices', label: 'Devices', icon: Smartphone, color: '#14B8A6' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, color: '#6B7280' },
]

export function AdminSidebar({ userName, userRole }: AdminSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
  }

  return (
    <>
      {/* Desktop sidebar - hidden on mobile */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen flex-shrink-0 relative z-20',
          'transition-all duration-200 ease-in-out',
          collapsed ? 'w-16' : 'w-64'
        )}
        style={{
          background: 'rgba(17, 24, 39, 0.6)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(139, 92, 246, 0.08)',
        }}
      >
        {/* Logo */}
        <div className={cn('flex items-center gap-3 px-4 py-5', collapsed && 'justify-center px-2')}
          style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
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
          {adminNavItems.map(({ href, label, icon: Icon, color }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn('nav-item', isActive && 'active', collapsed && 'justify-center px-2')}
                title={collapsed ? label : undefined}
                style={isActive ? {
                  background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                  border: `1px solid ${color}30`,
                  boxShadow: `0 0 12px ${color}15`,
                } : {}}
              >
                <Icon className="nav-icon" style={{ color: isActive ? color : undefined }} />
                {!collapsed && <span>{label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className={cn('p-3', collapsed && 'flex flex-col items-center')}
          style={{ borderTop: '1px solid rgba(139, 92, 246, 0.1)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-1 mb-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
                  boxShadow: '0 0 0 2px rgba(139,92,246,0.2)',
                }}>
                <span className="text-xs font-semibold text-violet-400">
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
              'w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium',
              'text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all',
              collapsed && 'justify-center px-2'
            )}
            title="Sign out"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>{isLoggingOut ? 'Signing out…' : 'Sign out'}</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute right-0 top-[72px] translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10 hidden lg:flex"
          style={{
            background: 'rgba(30, 41, 59, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
          }}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  )
}
