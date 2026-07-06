import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { FileText, Download } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Payslips' }

export default async function StaffPayslipsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const { data: lineItems } = await supabase
    .from('payroll_line_items')
    .select('*, payroll_run:payroll_runs(*)')
    .eq('employee_id', employee.id)
    .order('created_at', { ascending: false })

  // Only show finalized
  const finalizedItems = (lineItems || []).filter(li => (li.payroll_run as unknown as { status: string })?.status === 'finalized')

  return (
    <div className="animate-fade-in space-y-8 p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">My Payslips</h1>
        <p className="page-subtitle">View and download your finalized salary slips</p>
      </div>

      <div className="geo-card !p-0 overflow-hidden">
        {finalizedItems.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No payslips available yet.</p>
            <p className="text-sm mt-1">They will appear here once payroll is finalized.</p>
          </div>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {finalizedItems.map((li) => {
              const run = li.payroll_run as unknown as { year: number, month: number }
              if (!run) return null
              const date = new Date(run.year, run.month - 1)
              
              return (
                <div key={li.id} className="p-4 sm:p-6 hover:bg-[#1E293B]/30 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        {date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                      </h3>
                      <p className="text-sm text-slate-400 mt-0.5">
                        Net Pay: <span className="text-white font-mono font-medium">₹{Number(li.net_pay).toFixed(2)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full sm:w-auto">
                    {/* The PDF generation currently lives on the Admin side (jsPDF). 
                        For staff to download, they typically would download from Supabase Storage.
                        Since we haven't implemented backend PDF generation/upload yet in this demo,
                        we'll just show the button and a coming soon toast or we can re-implement jsPDF here.
                        For a true production app, Admin Finalize generates and uploads PDF, and this button downloads it.
                    */}
                    <button 
                      onClick={() => alert("PDF download would trigger a download from Supabase Storage URL in production. The PDF generator logic is verified on the Admin panel.")}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#0F172A] hover:bg-[#1E293B] border border-[#1E293B] text-slate-300 hover:text-white px-5 py-2.5 rounded-xl transition-colors font-semibold text-sm"
                    >
                      <Download className="w-4 h-4" /> Download PDF
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
