'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
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

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { href: '/admin/outlets', label: 'Outlets', icon: Building2, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  { href: '/admin/employees', label: 'Staff', icon: Users, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { href: '/admin/manage-pins', label: 'PINs', icon: KeyRound, color: '#EAB308', bg: 'rgba(234,179,8,0.12)' },
  { href: '/admin/attendance', label: 'Logs', icon: ClipboardList, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { href: '/admin/leave', label: 'Leave', icon: CalendarOff, color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
  { href: '/admin/payroll', label: 'Payroll', icon: Banknote, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  { href: '/admin/live-tracking', label: 'Live Track', icon: Radio, color: '#F97316', bg: 'rgba(249,115,22,0.12)' },
  { href: '/admin/devices', label: 'Devices', icon: Smartphone, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, color: '#6B7280', bg: 'rgba(107,114,128,0.12)' },
]

export function AdminBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 safe-area-pb"
      style={{
        background: 'rgba(10, 15, 30, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(139, 92, 246, 0.08)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.3)',
      }}>
      
      {/* Scrollable container with hidden scrollbar */}
      <div className="relative w-full">
        {/* Left ambient glow/fade indicator */}
        <div className="absolute left-0 top-0 bottom-0 w-6 z-10 pointer-events-none bg-gradient-to-r from-[#0a0f1e] to-transparent" />
        
        <div 
          className="flex items-center overflow-x-auto py-2 px-6 gap-5 h-16 no-scrollbar"
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Inline CSS to hide Webkit scrollbar */}
          <style>{`
            .no-scrollbar::-webkit-scrollbar {
              display: none !important;
            }
          `}</style>

          {adminNavItems.map(({ href, label, icon: Icon, color, bg }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-shrink-0 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative min-w-[56px]',
                  isActive ? 'text-white scale-105' : 'text-slate-500 hover:text-slate-300'
                )}
              >
                {isActive && (
                  <div className="absolute -top-1 w-6 h-[3px] rounded-full"
                    style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />
                )}
                <div className={cn('p-1.5 rounded-xl transition-all duration-200')}
                  style={isActive ? { background: bg } : {}}>
                  <Icon className="w-5 h-5 transition-colors duration-200" style={isActive ? { color } : {}} />
                </div>
                <span className="text-[9px] font-semibold tracking-wide transition-colors duration-200" style={isActive ? { color } : {}}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Right ambient glow/fade indicator */}
        <div className="absolute right-0 top-0 bottom-0 w-6 z-10 pointer-events-none bg-gradient-to-l from-[#0a0f1e] to-transparent" />
      </div>
    </nav>
  )
}
