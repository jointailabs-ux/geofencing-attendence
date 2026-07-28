'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Clock, ClipboardList, CalendarOff, Banknote, User } from 'lucide-react'

const staffNavItems = [
  { href: '/staff/dashboard', label: 'Clock In/Out', icon: Clock, color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },
  { href: '/staff/attendance', label: 'Attendance', icon: ClipboardList, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
  { href: '/staff/leave', label: 'Leave', icon: CalendarOff, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  { href: '/staff/payslips', label: 'Payslips', icon: Banknote, color: '#10B981', bg: 'rgba(16,185,129,0.12)' },
  { href: '/staff/profile', label: 'Profile', icon: User, color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },
]

export function StaffBottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 max-w-md mx-auto safe-area-pb">
      <nav className="rounded-3xl border border-white/10"
        style={{
          background: 'rgba(10, 15, 30, 0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
        }}>
        <div className="flex items-stretch h-16 px-2">
          {staffNavItems.map(({ href, label, icon: Icon, color, bg }) => {
            const isActive = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 transition-all duration-200 relative',
                  isActive ? 'text-white' : 'text-slate-500'
                )}
              >
                {/* Active indicator */}
                {isActive && (
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                    style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
                )}

                <div className={cn(
                  'p-1.5 rounded-xl transition-all duration-200 mt-1',
                  isActive && 'scale-110'
                )}
                  style={isActive ? { background: bg } : {}}>
                  <Icon
                    className="w-5 h-5 transition-colors duration-200"
                    style={isActive ? { color } : {}}
                  />
                </div>
                <span
                  className={cn('text-[9px] font-semibold transition-colors duration-200')}
                  style={isActive ? { color } : {}}
                >
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
