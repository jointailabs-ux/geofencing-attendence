import { redirect } from 'next/navigation'
import { getCachedEmployee } from '@/lib/auth'
import { ManagerSidebar } from '@/components/layout/ManagerSidebar'
import { ManagerBottomNav } from '@/components/layout/ManagerBottomNav'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { logout } from '@/app/actions/auth'
import { MapPin, LogOut } from 'lucide-react'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — GeoAttend Manager', default: 'GeoAttend Manager' },
}

export default async function ManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const employee = await getCachedEmployee()

  if (!employee || employee.role !== 'manager') {
    redirect('/login')
  }

  const outletName = employee.outlets?.name

  return (
    <div className="flex h-screen overflow-hidden bg-navy">
      <ManagerSidebar
        userName={employee.full_name}
        userRole={employee.role}
        outletName={outletName}
      />
      
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 flex flex-col"
        style={{
          background: '#0a0f1e',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(6,182,212,0.04), transparent 50%)',
        }}>
        
        {/* Mobile-first top header with glassmorphism (hidden on desktop) */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between h-14 px-4 flex-shrink-0"
          style={{
            background: 'rgba(17, 24, 39, 0.75)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(139, 92, 246, 0.1)',
          }}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)' }}>
              <MapPin className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">GeoAttend Manager</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge variant={employee.role} size="sm" showDot={false} />
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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full">
          {children}
        </div>
      </main>
      
      <ManagerBottomNav />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(17, 24, 39, 0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(139, 92, 246, 0.15)',
            color: '#E2E8F0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          },
        }}
      />
    </div>
  )
}
