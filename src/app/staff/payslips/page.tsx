import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FileText, ShieldCheck } from 'lucide-react'
import type { Metadata } from 'next'
import { StaffPayslipCard } from '@/components/payroll/StaffPayslipCard'

export const metadata: Metadata = { title: 'My Payslips - GeoAttend' }

export default async function StaffPayslipsPage() {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name, role, base_salary, outlets(name)')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const { data: lineItems } = await supabase
    .from('payroll_line_items')
    .select('*, payroll_runs(*), payroll_run:payroll_runs(*)')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  const finalizedItems = (lineItems || []).filter((li) => {
    const run = (li.payroll_runs || (li as unknown as { payroll_run?: { status: string } }).payroll_run) as
      | { status: string }
      | undefined
    const isSent = Boolean(li.adjustment_note && li.adjustment_note.includes('Sent'))
    return isSent || run?.status === 'finalized'
  })

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="page-header">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" /> Disbursed Salary Statements
        </div>
        <h1 className="page-title text-3xl font-extrabold text-white">My Monthly Payslips</h1>
        <p className="page-subtitle text-xs sm:text-sm text-slate-400 mt-1">
          Inspect your gross salary, mediclaim deductions, and net in-hand earnings released by admin.
        </p>
      </div>

      <div className="space-y-4">
        {finalizedItems.length === 0 ? (
          <div className="rounded-3xl p-12 text-center text-slate-500 bg-white/[0.02] border border-white/5 shadow-2xl">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-emerald-400" />
            <p className="text-sm font-semibold text-slate-300">No released payslips available yet.</p>
            <p className="text-xs text-slate-500 mt-1">
              Your monthly payslips will appear here automatically once the admin sends them to your profile.
            </p>
          </div>
        ) : (
          finalizedItems.map((li) => {
            const run = (li.payroll_runs || (li as unknown as { payroll_run?: { year: number; month: number; finalized_at?: string } }).payroll_run) as
              | { year: number; month: number; finalized_at?: string }
              | undefined

            const outletName = (employee.outlets as unknown as { name: string } | null)?.name || 'Main'

            return (
              <StaffPayslipCard
                key={li.id}
                item={li}
                run={run}
                employeeName={employee.full_name}
                role={employee.role}
                outletName={outletName}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
