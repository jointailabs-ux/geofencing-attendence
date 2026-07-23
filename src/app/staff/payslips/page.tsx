import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FileText, Download, IndianRupee, ShieldCheck, Percent, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'

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
    .select('*, payroll_run:payroll_runs(*)')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  const finalizedItems = (lineItems || []).filter(
    (li) =>
      (li.payroll_run as unknown as { status: string })?.status === 'finalized' ||
      Boolean((li as unknown as { is_sent: boolean })?.is_sent) ||
      Boolean(li.adjustment_note && li.adjustment_note.includes('Sent'))
  )

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

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
              Your monthly payslips will appear here automatically once the admin releases payroll.
            </p>
          </div>
        ) : (
          finalizedItems.map((li) => {
            const run = li.payroll_run as unknown as { year: number; month: number; finalized_at?: string }
            if (!run) return null

            const monthStr = monthNames[run.month - 1]
            const basePay = Number(li.base_pay) || 0
            const deductions = Number(li.deductions) || 0
            const netPay = Number(li.net_pay) || 0

            return (
              <div
                key={li.id}
                className="rounded-3xl p-6 bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all shadow-xl space-y-4"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <IndianRupee className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-white text-lg">
                        {monthStr} {run.year} Payslip
                      </h3>
                      <p className="text-xs text-slate-400">
                        Disbursed on {run.finalized_at ? new Date(run.finalized_at).toLocaleDateString() : 'End of Month'}
                      </p>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="w-3.5 h-3.5" /> RELEASED & DISBURSED
                  </span>
                </div>

                {/* Salary Breakdown 3-Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block font-sans">Gross Base Pay</span>
                    <span className="font-bold text-white text-base mt-0.5 block">
                      ₹{basePay.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-rose-400 uppercase block font-sans flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Mediclaim Deduction
                    </span>
                    <span className="font-bold text-rose-400 text-base mt-0.5 block">
                      -₹{deductions.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[9px] text-slate-500 font-sans">{li.deduction_note || 'Mediclaim Cut'}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-emerald-400 uppercase block font-sans">Net Salary In-Hand</span>
                    <span className="font-extrabold text-emerald-400 text-lg mt-0.5 block">
                      ₹{netPay.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Attendance Details Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
                  <div className="flex items-center gap-4">
                    <span>
                      Days Worked: <strong className="text-white">{li.days_present} Days</strong>
                    </span>
                    <span>
                      Paid Leave: <strong className="text-white">{li.days_leave_paid} Days</strong>
                    </span>
                  </div>

                  <a
                    href={`/admin/payroll`}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> View Payslip Statement
                  </a>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
