import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAllPayrollRuns, generateDraftPayroll } from '@/app/actions/payroll'
import { AdminPayrollRun } from '@/components/payroll/AdminPayrollRun'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Payroll Management' }

export default async function AdminPayrollPage() {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  let runs = await getAllPayrollRuns(employee.org_id)

  // Ensure current month payroll draft exists so page opens with all staff salaries populated
  const currentRun = runs.find((r) => r.month === currentMonth && r.year === currentYear)
  if (!currentRun) {
    try {
      await generateDraftPayroll(employee.org_id, currentMonth, currentYear, 20)
      runs = await getAllPayrollRuns(employee.org_id)
    } catch (e) {
      console.warn('Could not auto-generate current month draft:', e)
    }
  }

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
