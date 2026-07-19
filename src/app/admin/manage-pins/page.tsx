import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ManagePinsTable } from '@/components/employees/ManagePinsTable'
import { KeyRound, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manage PINs' }

export default async function ManagePinsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caller } = await supabase
    .from('employees')
    .select('org_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!caller || caller.role !== 'super_admin') redirect('/login')

  const { data: employees } = await supabase
    .from('employees')
    .select('id, full_name, employee_code, role, pin, outlets(name)')
    .eq('org_id', caller.org_id)
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-accent" />
            Manage PINs
          </h1>
          <p className="page-subtitle">
            Securely update login PINs for all employees
          </p>
        </div>
      </div>

      {!employees || employees.length === 0 ? (
        <div className="geo-card">
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <h2 className="empty-state-title">No employees found</h2>
          </div>
        </div>
      ) : (
        <ManagePinsTable employees={employees} />
      )}
    </div>
  )
}
