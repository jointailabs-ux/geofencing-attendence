'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateDraftPayroll, getPayrollRunDetails, updateLineItemAdjustments, finalizePayrollRun } from '@/app/actions/payroll'
import { Loader2, Plus, Edit3, CheckCircle2, FileText, FileSpreadsheet } from 'lucide-react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import { StatusBadge } from '@/components/ui/StatusBadge'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { PayrollRun, PayrollLineItem } from '@/lib/types/database'

export function AdminPayrollRun({ orgId, initialRuns }: { orgId: string, initialRuns: PayrollRun[] }) {
  const router = useRouter()
  const [runs] = useState(initialRuns)
  const [isGenerating, setIsGenerating] = useState(false)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())

  // Details Modal State
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetails, setRunDetails] = useState<(PayrollRun & { payroll_line_items: PayrollLineItem[] }) | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Edit Line Item State
  const [editingItem, setEditingItem] = useState<PayrollLineItem | null>(null)
  const [editForm, setEditForm] = useState({
    manual_adjustments: 0,
    adjustment_note: '',
    deductions: 0,
    deduction_note: ''
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateDraftPayroll(orgId, genMonth, genYear)
      toast.success('Payroll draft generated successfully')
      router.refresh()
      // Reload UI state locally for immediate feedback
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate payroll')
    } finally {
      setIsGenerating(false)
    }
  }

  const loadDetails = async (runId: string) => {
    setSelectedRunId(runId)
    setIsLoadingDetails(true)
    try {
      const details = await getPayrollRunDetails(runId)
      setRunDetails(details)
    } catch {
      toast.error('Failed to load run details')
      setSelectedRunId(null)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleSaveAdjustments = async () => {
    if (!editingItem || !runDetails) return
    try {
      await updateLineItemAdjustments(editingItem.id, {
        base_pay: editingItem.base_pay,
        ...editForm
      })
      toast.success('Adjustments saved')
      setEditingItem(null)
      loadDetails(runDetails.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save adjustments')
    }
  }

  const handleFinalize = async () => {
    if (!runDetails || !confirm('Are you sure? This will lock the payroll and cannot be undone.')) return
    try {
      await finalizePayrollRun(runDetails.id)
      toast.success('Payroll Finalized')
      window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to finalize payroll')
    }
  }

  const exportToExcel = () => {
    if (!runDetails) return
    
    const data = runDetails.payroll_line_items.map(li => ({
      'Employee Name': li.employee?.full_name,
      'Role': li.employee?.role,
      'Outlet': li.employee?.outlet?.name,
      'Salary Type': li.employee?.salary_type,
      'Days Present': li.days_present,
      'Paid Leave': li.days_leave_paid,
      'Unpaid Leave': li.days_leave_unpaid,
      'Absences': li.days_absent_unexcused,
      'Base Pay (₹)': li.base_pay,
      'Adjustments (₹)': li.manual_adjustments,
      'Adjustment Note': li.adjustment_note || '',
      'Deductions (₹)': li.deductions,
      'Deduction Note': li.deduction_note || '',
      'Net Pay (₹)': li.net_pay
    }))

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Payroll")
    XLSX.writeFile(wb, `Payroll_${runDetails.month}_${runDetails.year}.xlsx`)
  }

  const generatePDFs = () => {
    if (!runDetails) return
    
    // In a real app we might generate a zip. For now, we generate a single PDF with multiple pages, one per payslip.
    const doc = new jsPDF()
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    runDetails.payroll_line_items.forEach((li, index) => {
      if (index > 0) doc.addPage()
      
      doc.setFontSize(20)
      doc.text('PAYSLIP', 105, 20, { align: 'center' })
      
      doc.setFontSize(12)
      doc.text(`Employee: ${li.employee?.full_name}`, 20, 40)
      doc.text(`Role: ${li.employee?.role.toUpperCase()}`, 20, 48)
      doc.text(`Outlet: ${li.employee?.outlet?.name}`, 20, 56)
      
      doc.text(`Period: ${monthNames[runDetails.month - 1]} ${runDetails.year}`, 140, 40)
      doc.text(`Salary Type: ${li.employee?.salary_type.toUpperCase()}`, 140, 48)

      autoTable(doc, {
        startY: 70,
        head: [['Description', 'Days/Hours', 'Amount (₹)']],
        body: [
          ['Base Pay (includes Present & Paid Leave)', `${li.days_present + li.days_leave_paid} Days`, li.base_pay],
          ['Manual Adjustments (Bonus)', '-', li.manual_adjustments],
          ['Deductions', '-', `-${li.deductions}`],
        ],
        foot: [['NET PAY', '', `₹ ${li.net_pay}`]],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] }
      })
    })

    doc.save(`Payslips_${runDetails.month}_${runDetails.year}.pdf`)
  }

  return (
    <div className="space-y-6">
      {/* Generator Card */}
      <div className="geo-card !p-5 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Select Month</label>
          <input 
            type="month" 
            value={`${genYear}-${genMonth.toString().padStart(2, '0')}`}
            onChange={(e) => {
              const [y, m] = e.target.value.split('-')
              setGenYear(parseInt(y))
              setGenMonth(parseInt(m))
            }}
            className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-2.5 text-white focus:border-accent text-sm [color-scheme:dark]"
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="bg-accent hover:bg-accent-hover text-white px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          Generate Draft
        </button>
      </div>

      {/* Runs List */}
      <div className="geo-card !p-0 overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0F172A] text-xs uppercase text-slate-500 font-semibold border-b border-[#1E293B]">
            <tr>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Generated At</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {runs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                  No payroll runs generated yet.
                </td>
              </tr>
            )}
            {runs.map((r) => (
              <tr key={r.id} className="hover:bg-[#1E293B]/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white">
                  {new Date(r.year, r.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge 
                    variant={r.status === 'finalized' ? 'active' : 'pending'} 
                    label={r.status.toUpperCase()} 
                  />
                </td>
                <td className="px-6 py-4 text-slate-400">
                  {new Date(r.generated_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => loadDetails(r.id)}
                    className="text-accent hover:text-accent-hover font-medium px-3 py-1 bg-accent/10 rounded-lg transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Details Dialog */}
      <Dialog.Root open={!!selectedRunId} onOpenChange={(open) => !open && setSelectedRunId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95vw] max-w-6xl h-[90vh] flex flex-col bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
            
            {isLoadingDetails ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : runDetails ? (
              <>
                {/* Header */}
                <div className="p-6 border-b border-[#1E293B] flex justify-between items-center bg-[#0F172A] shrink-0">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      Payroll: {new Date(runDetails.year, runDetails.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </h2>
                    <div className="flex gap-2">
                       <StatusBadge variant={runDetails.status === 'finalized' ? 'active' : 'pending'} label={runDetails.status.toUpperCase()} />
                       <span className="text-sm text-slate-400 mt-0.5">
                         Total Net Pay: <strong className="text-white">₹{runDetails.payroll_line_items.reduce((acc, curr) => acc + Number(curr.net_pay), 0).toFixed(2)}</strong>
                       </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {runDetails.status === 'finalized' && (
                      <>
                        <button onClick={exportToExcel} className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                          <FileSpreadsheet className="w-4 h-4" /> Excel
                        </button>
                        <button onClick={generatePDFs} className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                          <FileText className="w-4 h-4" /> All Payslips (PDF)
                        </button>
                      </>
                    )}
                    {runDetails.status === 'draft' && (
                      <button onClick={handleFinalize} className="flex items-center gap-2 bg-valid hover:bg-valid-dark text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
                        <CheckCircle2 className="w-4 h-4" /> Finalize Payroll
                      </button>
                    )}
                    <button onClick={() => setSelectedRunId(null)} className="text-slate-400 hover:text-white px-4 py-2 text-sm font-semibold transition-colors">
                      Close
                    </button>
                  </div>
                </div>

                {/* Table Area */}
                <div className="overflow-y-auto flex-1 bg-[#1E293B]/20 p-6">
                  <div className="geo-card !p-0">
                    <table className="w-full text-left text-sm text-slate-300">
                      <thead className="bg-[#0F172A] text-xs uppercase text-slate-500 font-semibold border-b border-[#1E293B]">
                        <tr>
                          <th className="px-4 py-3">Employee</th>
                          <th className="px-4 py-3 text-right">Base Pay</th>
                          <th className="px-4 py-3 text-right">Adjustments</th>
                          <th className="px-4 py-3 text-right">Deductions</th>
                          <th className="px-4 py-3 text-right font-bold text-white">Net Pay</th>
                          {runDetails.status === 'draft' && <th className="px-4 py-3 text-center">Edit</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1E293B]">
                        {runDetails.payroll_line_items.map(li => (
                          <tr key={li.id} className="hover:bg-[#1E293B]/30">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-white">{li.employee?.full_name}</p>
                              <p className="text-xs text-slate-500">{li.employee?.outlet?.name} • {li.days_present}P {li.days_leave_paid}L</p>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">₹{Number(li.base_pay).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-valid font-mono">+{Number(li.manual_adjustments).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right text-danger font-mono">-{Number(li.deductions).toFixed(2)}</td>
                            <td className="px-4 py-3 text-right font-bold text-white font-mono">₹{Number(li.net_pay).toFixed(2)}</td>
                            {runDetails.status === 'draft' && (
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => {
                                    setEditingItem(li)
                                    setEditForm({
                                      manual_adjustments: li.manual_adjustments,
                                      adjustment_note: li.adjustment_note || '',
                                      deductions: li.deductions,
                                      deduction_note: li.deduction_note || ''
                                    })
                                  }}
                                  className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : null}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Edit Adjustments Dialog */}
      <Dialog.Root open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-[60] animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl z-[60] p-6 animate-fade-in">
            <Dialog.Title className="text-xl font-bold text-white mb-4">Edit Adjustments</Dialog.Title>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Additions (Bonus/Overtime)</label>
                <input
                  type="number"
                  value={editForm.manual_adjustments}
                  onChange={e => setEditForm({...editForm, manual_adjustments: Number(e.target.value)})}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent text-sm mb-2"
                />
                <input
                  type="text"
                  placeholder="Note for addition..."
                  value={editForm.adjustment_note}
                  onChange={e => setEditForm({...editForm, adjustment_note: e.target.value})}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Deductions (Advances/Penalty)</label>
                <input
                  type="number"
                  value={editForm.deductions}
                  onChange={e => setEditForm({...editForm, deductions: Number(e.target.value)})}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent text-sm mb-2"
                />
                <input
                  type="text"
                  placeholder="Note for deduction..."
                  value={editForm.deduction_note}
                  onChange={e => setEditForm({...editForm, deduction_note: e.target.value})}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl px-4 py-2 text-white focus:outline-none focus:border-accent text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveAdjustments}
                  className="bg-accent hover:bg-accent-hover text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
