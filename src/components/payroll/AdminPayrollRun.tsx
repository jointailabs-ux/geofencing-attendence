'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateDraftPayroll,
  getPayrollRunDetails,
  updateLineItemAdjustments,
  finalizePayrollRun,
} from '@/app/actions/payroll'
import {
  Loader2,
  Plus,
  FileText,
  FileSpreadsheet,
  IndianRupee,
  ShieldCheck,
  Percent,
  Send,
  Calendar,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import type { PayrollRun, PayrollLineItem } from '@/lib/types/database'
import { getOutletColor } from '@/lib/outletColors'

export function AdminPayrollRun({ orgId, initialRuns }: { orgId: string; initialRuns: PayrollRun[] }) {
  const router = useRouter()
  const [runs] = useState(initialRuns)
  const [isGenerating, setIsGenerating] = useState(false)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [mediclaimPct, setMediclaimPct] = useState<number>(20) // Default 20% mediclaim deduction

  // Details Modal State
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const [runDetails, setRunDetails] = useState<(PayrollRun & { payroll_line_items: PayrollLineItem[] }) | null>(
    null
  )
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  // Edit Line Item State
  const [editingItem, setEditingItem] = useState<PayrollLineItem | null>(null)
  const [editForm, setEditForm] = useState({
    manual_adjustments: 0,
    adjustment_note: '',
    deductions: 0,
    deduction_note: '',
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      await generateDraftPayroll(orgId, genMonth, genYear, mediclaimPct)
      toast.success(`Payroll draft generated for Month ${genMonth}/${genYear} with ${mediclaimPct}% Mediclaim deduction`)
      router.refresh()
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
        ...editForm,
      })
      toast.success('Salary adjustments saved successfully')
      setEditingItem(null)
      loadDetails(runDetails.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save adjustments')
    }
  }

  const handleFinalize = async () => {
    if (!runDetails || !confirm('Are you sure you want to release money for this month? This will lock payroll and mark salaries as disbursed to all employees.'))
      return
    try {
      await finalizePayrollRun(runDetails.id)
      toast.success('Payroll released and money disbursed successfully!')
      window.location.reload()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to finalize payroll')
    }
  }

  const exportToExcel = () => {
    if (!runDetails) return

    const data = runDetails.payroll_line_items.map((li) => {
      const basePay = Number(li.base_pay) || 0
      const deductions = Number(li.deductions) || 0
      const manual = Number(li.manual_adjustments) || 0
      const netPay = Number(li.net_pay) || 0

      return {
        'Employee Name': li.employee?.full_name,
        Role: li.employee?.role,
        Outlet: li.employee?.outlet?.name || 'Unassigned',
        'Salary Type': li.employee?.salary_type,
        'Days Present': li.days_present,
        'Paid Leave': li.days_leave_paid,
        'Unpaid Leave': li.days_leave_unpaid,
        Absences: li.days_absent_unexcused,
        'Base Gross Pay (₹)': basePay,
        'Mediclaim & Deductions (₹)': deductions,
        'Deduction Note': li.deduction_note || '',
        'Bonus/Adjustments (₹)': manual,
        'Net In-Hand Pay (₹)': netPay,
      }
    })

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Payroll')
    XLSX.writeFile(wb, `Payroll_${runDetails.month}_${runDetails.year}.xlsx`)
  }

  const generatePDFs = () => {
    if (!runDetails) return

    const doc = new jsPDF()
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

    runDetails.payroll_line_items.forEach((li, index) => {
      if (index > 0) doc.addPage()

      const basePay = Number(li.base_pay) || 0
      const deductions = Number(li.deductions) || 0
      const netPay = Number(li.net_pay) || 0
      const adjustments = Number(li.manual_adjustments) || 0

      doc.setFontSize(22)
      doc.setTextColor(16, 185, 129)
      doc.text('GeoAttend Official Salary Slip', 105, 20, { align: 'center' })

      doc.setFontSize(10)
      doc.setTextColor(100, 116, 139)
      doc.text(`Period: ${monthNames[runDetails.month - 1]} ${runDetails.year}`, 105, 27, { align: 'center' })

      doc.setFontSize(12)
      doc.setTextColor(15, 23, 42)
      doc.text(`Employee Name: ${li.employee?.full_name}`, 20, 42)
      doc.text(`Role: ${li.employee?.role.toUpperCase()}`, 20, 50)
      doc.text(`Outlet Location: ${li.employee?.outlet?.name || 'Main'}`, 20, 58)

      doc.text(`Status: DISBURSED & RELEASED`, 130, 42)
      doc.text(`Salary Scheme: ${li.employee?.salary_type.toUpperCase()}`, 130, 50)

      autoTable(doc, {
        startY: 68,
        head: [['Earnings & Deductions Component', 'Details / Basis', 'Amount (INR)']],
        body: [
          ['Gross Base Pay', `${li.days_present} Days Present + ${li.days_leave_paid} Paid Leave`, `₹ ${basePay.toFixed(2)}`],
          [`Mediclaim / Health Deduction`, li.deduction_note || 'Standard Mediclaim', `- ₹ ${deductions.toFixed(2)}`],
          ['Manual Bonus / Adjustments', li.adjustment_note || 'N/A', `+ ₹ ${adjustments.toFixed(2)}`],
        ],
        foot: [['NET SALARY IN-HAND RELEASED', '', `₹ ${netPay.toFixed(2)}`]],
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42] },
        footStyles: { fillColor: [16, 185, 129] },
      })
    })

    doc.save(`Payslips_${runDetails.month}_${runDetails.year}.pdf`)
  }

  // Calculate live preview totals
  const totalBasePaySum = runDetails?.payroll_line_items.reduce((acc, curr) => acc + Number(curr.base_pay), 0) || 0
  const totalDeductionsSum = runDetails?.payroll_line_items.reduce((acc, curr) => acc + Number(curr.deductions), 0) || 0
  const totalNetPaySum = runDetails?.payroll_line_items.reduce((acc, curr) => acc + Number(curr.net_pay), 0) || 0

  return (
    <div className="space-y-8">
      {/* Top Banner: Mediclaim Configurator & Run Generator */}
      <div
        className="rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(16,185,129,0.05), rgba(10,15,30,0.95))',
          border: '1px solid rgba(6,182,212,0.2)',
        }}
      >
        <div className="relative z-10 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
              <Percent className="w-3.5 h-3.5" /> Mediclaim & Payroll Configurator
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Monthly Payroll & Salary Release</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Configure Mediclaim deduction percentages (e.g. 20% cut from ₹10,000 salary = ₹2,000 Mediclaim, leaving ₹8,000 Net In-Hand), generate monthly payroll drafts, and release money to employees.
            </p>
          </div>

          {/* Form Controls Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end bg-white/[0.02] p-4 sm:p-5 rounded-2xl border border-white/5">
            {/* Month Select */}
            <div className="sm:col-span-3">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Payroll Month
              </label>
              <select
                value={genMonth}
                onChange={(e) => setGenMonth(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {[
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
                ].map((m, idx) => (
                  <option key={m} value={idx + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Select */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Year</label>
              <select
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Mediclaim Deduction % Config */}
            <div className="sm:col-span-4">
              <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5" /> Mediclaim Deduction (%)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={mediclaimPct}
                  onChange={(e) => setMediclaimPct(Math.max(0, Math.min(50, Number(e.target.value))))}
                  className="w-full bg-slate-900 border border-cyan-500/40 rounded-xl px-3.5 py-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-cyan-400"
                />
                <div className="flex gap-1 shrink-0">
                  {[10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setMediclaimPct(pct)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                        mediclaimPct === pct
                          ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="sm:col-span-3">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-lg disabled:opacity-50"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Generate Draft ({mediclaimPct}%)
              </button>
            </div>
          </div>

          {/* Example Calculation Box */}
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 flex items-center gap-3">
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <strong className="text-white">Example Calculation:</strong> For a staff member with ₹10,000 Base Salary at{' '}
              <span className="underline font-bold">{mediclaimPct}% Mediclaim</span> cut, ₹
              {((10000 * mediclaimPct) / 100).toLocaleString('en-IN')} will be deducted for Mediclaim, leaving{' '}
              <strong className="text-emerald-400">
                ₹{(10000 - (10000 * mediclaimPct) / 100).toLocaleString('en-IN')} Net In-Hand Salary
              </strong>
              .
            </div>
          </div>
        </div>
      </div>

      {/* Generated Payroll Runs List */}
      <div className="rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" /> Monthly Payroll Cycles ({runs.length})
            </h3>
            <p className="text-xs text-slate-400 mt-1">Select a monthly payroll cycle to review employee salaries or release money</p>
          </div>
        </div>

        {runs.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-sm">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            No payroll runs generated yet. Select a month above and click &quot;Generate Draft&quot;.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {runs.map((run) => {
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
              const isFinalized = run.status === 'finalized'

              return (
                <div
                  key={run.id}
                  className="p-5 sm:p-6 hover:bg-white/[0.03] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${
                        isFinalized
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      <IndianRupee className="w-6 h-6" />
                    </div>

                    <div>
                      <h4 className="font-extrabold text-white text-lg">
                        {monthNames[run.month - 1]} {run.year}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {isFinalized ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <ShieldCheck className="w-3 h-3" /> RELEASED & DISBURSED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            DRAFT PENDING
                          </span>
                        )}
                        <span className="text-xs text-slate-500">• Created {new Date(run.generated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => loadDetails(run.id)}
                      className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 transition-colors"
                    >
                      Manage &amp; Inspect Salaries →
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* PAYROLL DETAILS MODAL */}
      <Dialog.Root open={!!selectedRunId} onOpenChange={(open) => !open && setSelectedRunId(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl max-h-[90vh] bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 overflow-hidden flex flex-col z-50">
            {isLoadingDetails || !runDetails ? (
              <div className="py-20 text-center text-slate-400 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
                <p className="text-xs font-semibold">Loading employee salary breakdown...</p>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden space-y-6">
                {/* Modal Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Dialog.Title className="text-2xl font-extrabold text-white">
                        Payroll Run: {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][runDetails.month - 1]} {runDetails.year}
                      </Dialog.Title>

                      {runDetails.status === 'finalized' ? (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          RELEASED &amp; DISBURSED
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          DRAFT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Inspect individual base salaries, mediclaim cuts, net in-hand pay, and release money for this month.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={exportToExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20"
                    >
                      <FileSpreadsheet className="w-4 h-4" /> Export Excel
                    </button>
                    <button
                      onClick={generatePDFs}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20"
                    >
                      <FileText className="w-4 h-4" /> Download All Payslips
                    </button>
                  </div>
                </div>

                {/* 3 Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Base Salary</span>
                    <p className="text-2xl font-extrabold text-white font-mono mt-1">
                      ₹{totalBasePaySum.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                    <span className="text-[10px] font-bold text-rose-400 uppercase">Total Mediclaim &amp; Deductions</span>
                    <p className="text-2xl font-extrabold text-rose-300 font-mono mt-1">
                      -₹{totalDeductionsSum.toLocaleString('en-IN')}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Net In-Hand Salary Released</span>
                    <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                      ₹{totalNetPaySum.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {/* Scrollable Table */}
                <div className="flex-1 overflow-y-auto border border-white/5 rounded-2xl custom-scrollbar">
                  <table className="w-full text-left text-xs text-slate-300 border-collapse">
                    <thead className="text-[10px] uppercase text-slate-400 font-bold bg-slate-950 sticky top-0 border-b border-white/5 z-10">
                      <tr>
                        <th className="px-4 py-3">Employee</th>
                        <th className="px-4 py-3">Outlet</th>
                        <th className="px-4 py-3">Attendance</th>
                        <th className="px-4 py-3">Base Pay</th>
                        <th className="px-4 py-3">Mediclaim Cut</th>
                        <th className="px-4 py-3">Bonus / Adj</th>
                        <th className="px-4 py-3">Net In-Hand</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {runDetails.payroll_line_items.map((li) => {
                        const theme = getOutletColor(li.employee?.outlet?.name)
                        const basePay = Number(li.base_pay) || 0
                        const deductions = Number(li.deductions) || 0
                        const manual = Number(li.manual_adjustments) || 0
                        const netPay = Number(li.net_pay) || 0

                        return (
                          <tr key={li.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* Employee */}
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
                                  style={{ background: theme.gradient }}
                                >
                                  {li.employee?.full_name.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-bold text-white leading-tight">{li.employee?.full_name}</p>
                                  <span className="text-[9px] text-slate-500 uppercase">{li.employee?.role}</span>
                                </div>
                              </div>
                            </td>

                            {/* Outlet */}
                            <td className="px-4 py-3">
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  background: theme.badgeBg,
                                  color: theme.badgeText,
                                  border: `1px solid ${theme.badgeBorder}`,
                                }}
                              >
                                {li.employee?.outlet?.name || 'Main'}
                              </span>
                            </td>

                            {/* Attendance */}
                            <td className="px-4 py-3 font-mono text-[11px]">
                              <span className="text-emerald-400 font-bold">{li.days_present}P</span> /{' '}
                              <span className="text-cyan-400">{li.days_leave_paid}L</span> /{' '}
                              <span className="text-rose-400">{li.days_absent_unexcused}A</span>
                            </td>

                            {/* Base Pay */}
                            <td className="px-4 py-3 font-mono font-semibold text-white">
                              ₹{basePay.toLocaleString('en-IN')}
                            </td>

                            {/* Mediclaim Cut */}
                            <td className="px-4 py-3 font-mono text-rose-400 font-semibold">
                              -₹{deductions.toLocaleString('en-IN')}
                            </td>

                            {/* Adjustments */}
                            <td className="px-4 py-3 font-mono text-cyan-400 font-semibold">
                              {manual >= 0 ? `+₹${manual}` : `-₹${Math.abs(manual)}`}
                            </td>

                            {/* Net In-Hand Pay */}
                            <td className="px-4 py-3 font-mono text-sm font-extrabold text-emerald-400">
                              ₹{netPay.toLocaleString('en-IN')}
                            </td>

                            {/* Actions */}
                            <td className="px-4 py-3">
                              {runDetails.status !== 'finalized' && (
                                <button
                                  onClick={() => {
                                    setEditingItem(li)
                                    setEditForm({
                                      manual_adjustments: Number(li.manual_adjustments) || 0,
                                      adjustment_note: li.adjustment_note || '',
                                      deductions: Number(li.deductions) || 0,
                                      deduction_note: li.deduction_note || '',
                                    })
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-400 font-bold text-[10px] border border-white/10"
                                >
                                  Edit Pay
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Footer Release Button */}
                <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                  <Dialog.Close className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white font-bold text-xs">
                    Close
                  </Dialog.Close>

                  {runDetails.status !== 'finalized' && (
                    <button
                      onClick={handleFinalize}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-xl"
                    >
                      <Send className="w-4 h-4" /> Release Money &amp; Pay Employees (₹
                      {totalNetPaySum.toLocaleString('en-IN')})
                    </button>
                  )}
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* EDIT ITEM ADJUSTMENTS MODAL */}
      <Dialog.Root open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-2xl p-6 space-y-4 z-50">
            <Dialog.Title className="text-lg font-bold text-white">
              Edit Salary Adjustments for {editingItem?.employee?.full_name}
            </Dialog.Title>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Mediclaim / Deductions (₹)</label>
                <input
                  type="number"
                  value={editForm.deductions}
                  onChange={(e) => setEditForm({ ...editForm, deductions: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Deduction Note</label>
                <input
                  type="text"
                  value={editForm.deduction_note}
                  onChange={(e) => setEditForm({ ...editForm, deduction_note: e.target.value })}
                  placeholder="e.g. Mediclaim Policy Cut (20%)"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Manual Bonus / Addition (₹)</label>
                <input
                  type="number"
                  value={editForm.manual_adjustments}
                  onChange={(e) => setEditForm({ ...editForm, manual_adjustments: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-400 mb-1">Bonus Note</label>
                <input
                  type="text"
                  value={editForm.adjustment_note}
                  onChange={(e) => setEditForm({ ...editForm, adjustment_note: e.target.value })}
                  placeholder="e.g. Monthly Performance Bonus"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl bg-white/5 text-slate-400 hover:text-white font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveAdjustments}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400"
              >
                Save Changes
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
