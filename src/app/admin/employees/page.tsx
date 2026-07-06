import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { EmployeeTable } from '@/components/employees/EmployeeTable'
import { Users, UserPlus } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Employees' }

export default async function EmployeesPage() {
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

  if (!caller) redirect('/login')

  const [{ data: employees }, { data: outlets }] = await Promise.all([
    supabase
      .from('employees')
      .select('*, outlets(id, name)')
      .eq('org_id', caller.org_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('outlets')
      .select('id, name')
      .eq('org_id', caller.org_id)
      .order('name'),
  ])

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Employees</h1>
          <p className="page-subtitle">
            {employees?.length ?? 0} employee{(employees?.length ?? 0) !== 1 ? 's' : ''} across all outlets
          </p>
        </div>
        <Link
          href="/admin/employees/new"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <UserPlus className="w-4 h-4" />
          Add Employee
        </Link>
      </div>

      {!employees || employees.length === 0 ? (
        <div className="geo-card">
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <h2 className="empty-state-title">No employees yet</h2>
            <p className="empty-state-description">
              Add your first employee. They&apos;ll receive an email invite to set their password.
            </p>
            <Link
              href="/admin/employees/new"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add First Employee
            </Link>
          </div>
        </div>
      ) : (
        <EmployeeTable
          employees={employees as Parameters<typeof EmployeeTable>[0]['employees']}
          outlets={outlets ?? []}
          basePath="/admin"
        />
      )}
    </div>
  )
}
