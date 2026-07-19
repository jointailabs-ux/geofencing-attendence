import { Suspense } from 'react'
import { StaffHeaderWrapper } from '@/components/layout/StaffHeaderWrapper'
import { StaffBottomNav } from '@/components/layout/StaffBottomNav'
import { Toaster } from 'sonner'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { template: '%s — GeoAttend', default: 'GeoAttend' },
}

export default function StaffLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0f1e' }}>
      <Suspense fallback={
        <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-gray-900 border-b border-gray-800 animate-pulse" />
      }>
        <StaffHeaderWrapper />
      </Suspense>

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
