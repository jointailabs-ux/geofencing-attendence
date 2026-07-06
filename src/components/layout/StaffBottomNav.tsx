'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Clock, ClipboardList, CalendarOff, Banknote } from 'lucide-react'

const staffNavItems = [
  { href: '/staff/dashboard', label: 'Clock In/Out', icon: Clock },
  { href: '/staff/attendance', label: 'My Attendance', icon: ClipboardList },
  { href: '/staff/leave', label: 'My Leave', icon: CalendarOff },
  { href: '/staff/payslips', label: 'Payslips', icon: Banknote },
]

export function StaffBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#1E293B] border-t border-[#334155] safe-area-pb">
      <div className="flex items-stretch h-16">
        {staffNavItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn('bottom-nav-item flex-1', isActive && 'active')}
            >
              <Icon className={cn('w-5 h-5', isActive ? 'text-accent' : 'text-slate-500')} />
              <span className={cn('text-[10px] font-medium', isActive ? 'text-accent' : 'text-slate-500')}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
