'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  MapPin,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  KeyRound,
  ClipboardList,
  CalendarOff,
  Banknote,
  Radio,
  Smartphone,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminMobileHeaderProps {
  userName: string
}

const navItems = [
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

export function AdminMobileHeader({ userName }: AdminMobileHeaderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const closeMenu = () => setIsOpen(false)

  return (
    <>
      <header
        className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 flex-shrink-0"
        style={{
          background: 'rgba(17, 24, 39, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsOpen(true)}
            className="p-1 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">GeoAttend Admin</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge variant="super_admin" size="sm" showDot={false} />
        </div>
      </header>

      {/* Slide-over Mobile Navigation Drawer */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden transition-opacity duration-300 pointer-events-none',
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'
        )}
      >
        {/* Backdrop overlay */}
        <div
          onClick={closeMenu}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Menu content container */}
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-xs bg-slate-950 border-r border-white/10 flex flex-col transition-transform duration-300 ease-out shadow-2xl',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
                <MapPin className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">GeoAttend</span>
            </div>
            <button
              onClick={closeMenu}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links list */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ href, label, icon: Icon, color }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/')
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMenu}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all',
                    isActive && 'text-white bg-white/[0.04]'
                  )}
                  style={
                    isActive
                      ? {
                          border: `1px solid ${color}30`,
                          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
                        }
                      : {}
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" style={{ color: isActive ? color : undefined }} />
                  <span>{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* User profile footer */}
          <div className="p-4 border-t border-white/5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
                <span className="text-xs font-semibold text-violet-400">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-[10px] text-slate-500 capitalize">Super Admin</p>
              </div>
            </div>
            <form action={logout}>
              <button
                type="submit"
                onClick={closeMenu}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                <span>Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
