'use client'

import { logout } from '@/app/actions/auth'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MapPin, LogOut } from 'lucide-react'

interface AdminMobileHeaderProps {
  userName: string
}

export function AdminMobileHeader({ userName }: AdminMobileHeaderProps) {
  return (
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
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
          <MapPin className="w-3.5 h-3.5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white leading-none">GeoAttend Admin</p>
          <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[120px]" title={userName}>
            {userName}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <StatusBadge variant="super_admin" size="sm" showDot={false} />
        <form action={logout}>
          <button
            type="submit"
            className="p-1.5 text-slate-400 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </header>
  )
}
