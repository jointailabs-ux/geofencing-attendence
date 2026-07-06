import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAllPayrollRuns } from '@/app/actions/payroll'
import { AdminPayrollRun } from '@/components/payroll/AdminPayrollRun'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payroll Management' }

export default async function AdminPayrollPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const runs = await getAllPayrollRuns(employee.org_id)

  return (
    <div className="animate-fade-in space-y-8">
      <div className="page-header">
        <h1 className="page-title">Payroll Runs</h1>
        <p className="page-subtitle">Generate and finalize monthly payroll for your organization.</p>
      </div>

      <AdminPayrollRun orgId={employee.org_id} initialRuns={runs} />
    </div>
  )
}
