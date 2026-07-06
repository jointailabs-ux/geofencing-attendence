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
    <div className="flex h-screen overflow-hidden">
      <ManagerSidebar
        userName={employee.full_name}
        userRole={employee.role}
        outletName={outletName}
      />
      <main className="flex-1 overflow-y-auto bg-[#0F172A] lg:pt-0 pt-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
      <Toaster
        position="top-right"
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
