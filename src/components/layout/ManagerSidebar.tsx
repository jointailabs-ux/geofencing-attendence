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
  ClipboardList,
  CalendarOff,
  LogOut,
  MapPin,
  Menu,
  Building2,
} from 'lucide-react'

interface ManagerSidebarProps {
  userName: string
  userRole: EmployeeRole
  outletName?: string
}

const managerNavItems = [
  { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/manager/attendance', label: 'Attendance', icon: ClipboardList },
  { href: '/manager/leave', label: 'Leave Approvals', icon: CalendarOff },
]

export function ManagerSidebar({ userName, userRole, outletName }: ManagerSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await logout()
  }

  const NavContent = () => (
    <>
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[#334155]">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-white">GeoAttend</span>
          {outletName && (
            <div className="flex items-center gap-1 mt-0.5">
              <Building2 className="w-2.5 h-2.5 text-slate-500" />
              <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{outletName}</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {managerNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn('nav-item', isActive && 'active')}
            >
              <Icon className="nav-icon" />
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-[#334155] p-3">
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
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>{isLoggingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      <aside className="hidden lg:flex flex-col h-screen w-64 bg-[#1E293B] border-r border-[#334155] flex-shrink-0">
        <NavContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 bottom-0 w-64 bg-[#1E293B] border-r border-[#334155] flex flex-col animate-slide-in-left"
            onClick={(e) => e.stopPropagation()}
          >
            <NavContent />
          </aside>
        </div>
      )}

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
          {outletName && <span className="text-xs text-slate-500">· {outletName}</span>}
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
