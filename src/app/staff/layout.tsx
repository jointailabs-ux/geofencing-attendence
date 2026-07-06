import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StaffBottomNav } from '@/components/layout/StaffBottomNav'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { logout } from '@/app/actions/auth'
import { Toaster } from 'sonner'
import { MapPin, LogOut } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — GeoAttend', default: 'GeoAttend' },
}

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('full_name, role, outlet_id, outlets(name)')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const outletName = (employee.outlets as unknown as { name: string } | null)?.name ?? 'No outlet assigned'

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      {/* Mobile-first top header */}
      <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-[#1E293B] border-b border-[#334155]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">{employee.full_name}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{outletName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant={employee.role} size="sm" showDot={false} />
          <form action={logout}>
            <button
              type="submit"
              className="p-1.5 text-slate-400 hover:text-danger transition-colors rounded-lg hover:bg-danger/10"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </form>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 pb-20 px-4 py-5 max-w-lg mx-auto w-full">
        {children}
      </main>

      {/* Bottom navigation */}
      <StaffBottomNav />

      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1E293B',
            border: '1px solid #334155',
            color: '#E2E8F0',
          },
        }}
      />
    </div>
  )
}
