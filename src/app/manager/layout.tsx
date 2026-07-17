import { redirect } from 'next/navigation'
import { getCachedEmployee } from '@/lib/auth'
import { ManagerSidebar } from '@/components/layout/ManagerSidebar'
import { ManagerBottomNav } from '@/components/layout/ManagerBottomNav'
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
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0"
        style={{
          background: '#0a0f1e',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(6,182,212,0.04), transparent 50%)',
        }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
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
