import { Suspense } from 'react'
import { getCachedEmployee } from '@/lib/auth'
import { AdminSidebarWrapper } from '@/components/layout/AdminSidebarWrapper'
import { AdminBottomNav } from '@/components/layout/AdminBottomNav'
import { AdminMobileHeader } from '@/components/layout/AdminMobileHeader'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — GeoAttend Admin', default: 'GeoAttend Admin' },
  description: 'GeoAttend Admin — Manage outlets, employees, attendance and payroll',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const employee = await getCachedEmployee()
  const userName = employee?.full_name || 'Admin'

  return (
    <div className="flex h-screen overflow-hidden bg-navy">
      <Suspense fallback={
        <div className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 animate-pulse" />
      }>
        <AdminSidebarWrapper />
      </Suspense>
      
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 flex flex-col"
        style={{
          background: '#0a0f1e',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.06), transparent 50%), radial-gradient(ellipse at 100% 100%, rgba(6,182,212,0.04), transparent 50%)',
        }}>
        
        {/* Mobile Navigation Header & Drawer */}
        <AdminMobileHeader userName={userName} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
          {children}
        </div>
      </main>
      
      <AdminBottomNav />

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
