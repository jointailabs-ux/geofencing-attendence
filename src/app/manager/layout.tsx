import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ManagerSidebar } from '@/components/layout/ManagerSidebar'
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

  if (!employee || employee.role !== 'manager') {
    redirect('/login')
  }

  const outletName = (employee.outlets as unknown as { name: string } | null)?.name ?? undefined

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0a0f1e' }}>
      <ManagerSidebar
        userName={employee.full_name}
        userRole={employee.role}
        outletName={outletName}
      />
      <main className="flex-1 overflow-y-auto lg:pt-0 pt-14"
        style={{
          background: '#0a0f1e',
          backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.04), transparent 50%)',
        }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
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
