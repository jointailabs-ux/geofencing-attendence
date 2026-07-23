'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  generateDraftPayroll,
  getPayrollRunDetails,
  updateLineItemAdjustments,
  finalizePayrollRun,
  sendIndividualPayslip,
} from '@/app/actions/payroll'
import {
  Loader2,
  FileText,
  FileSpreadsheet,
  IndianRupee,
  ShieldCheck,
  Percent,
  Send,
  Calendar,
  HelpCircle,
  Search,
  Download,
  Settings2,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
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
  const [isFinalizing, setIsFinalizing] = useState(false)
  const [genMonth, setGenMonth] = useState(new Date().getMonth() + 1)
  const [genYear, setGenYear] = useState(new Date().getFullYear())
  const [mediclaimPct, setMediclaimPct] = useState<number>(20) // Default 20% mediclaim deduction
  const [searchQuery, setSearchQuery] = useState('')

  // Mediclaim Config Modal Open State
  const [isMediclaimModalOpen, setIsMediclaimModalOpen] = useState(false)

  // Currently Loaded Run Details
  const [selectedRunId, setSelectedRunId] = useState<string | null>(initialRuns[0]?.id || null)
  const [runDetails, setRunDetails] = useState<(PayrollRun & { payroll_line_items: PayrollLineItem[] }) | null>(
    null
  )
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const [sendingId, setSendingId] = useState<string | null>(null)

  const handleSendPayslip = async (li: PayrollLineItem) => {
    setSendingId(li.id)
    try {
      const res = await sendIndividualPayslip(li.id)
      toast.success(`Payslip for ${res.employeeName || li.employee?.full_name} sent directly to their staff profile!`)
      if (selectedRunId) loadRunDetails(selectedRunId)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send payslip')
    } finally {
      setSendingId(null)
    }
  }

  const [editingItem, setEditingItem] = useState<PayrollLineItem | null>(null)
  const [editForm, setEditForm] = useState({
    manual_adjustments: 0,
    adjustment_note: '',
    deductions: 0,
    deduction_note: '',
  })

  // Automatically load details for the selected run ID
  const loadRunDetails = async (runId: string) => {
    setSelectedRunId(runId)
    setIsLoadingDetails(true)
    try {
      const details = await getPayrollRunDetails(runId)
      setRunDetails(details)
    } catch {
      toast.error('Failed to load payroll details')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  // Initial load effect
  useEffect(() => {
    if (selectedRunId && !runDetails && !isLoadingDetails) {
      loadRunDetails(selectedRunId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRunId])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const res = await generateDraftPayroll(orgId, genMonth, genYear, mediclaimPct)
      toast.success(`Payroll generated for ${genMonth}/${genYear} with ${mediclaimPct}% Mediclaim deduction`)
      if (res?.runId) {
        await loadRunDetails(res.runId)
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate payroll')
    } finally {
      setIsGenerating(false)
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
      loadRunDetails(runDetails.id)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save adjustments')
    }
  }

  const handleFinalize = async () => {
    if (!runDetails || !confirm('Are you sure you want to release money and send payslips to all staff for this month?'))
      return
    setIsFinalizing(true)
    try {
      await finalizePayrollRun(runDetails.id)
      toast.success('Payroll Released & Payslips sent to staff profiles!')
      await loadRunDetails(runDetails.id)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to finalize payroll')
    } finally {
      setIsFinalizing(false)
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

  const downloadSinglePDF = (li: PayrollLineItem) => {
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

    const basePay = Number(li.base_pay) || 0
    const deductions = Number(li.deductions) || 0
    const netPay = Number(li.net_pay) || 0
    const adjustments = Number(li.manual_adjustments) || 0

    doc.setFontSize(20)
    doc.setTextColor(16, 185, 129)
    doc.text('GeoAttend Official Salary Statement', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Pay Period: ${monthNames[runDetails.month - 1]} ${runDetails.year}`, 105, 27, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(`Employee Name: ${li.employee?.full_name}`, 20, 42)
    doc.text(`Role: ${li.employee?.role.toUpperCase()}`, 20, 50)
    doc.text(`Outlet Location: ${li.employee?.outlet?.name || 'Main'}`, 20, 58)

    doc.text(`Status: RELEASED & DISBURSED`, 130, 42)
    doc.text(`Salary Scheme: ${li.employee?.salary_type.toUpperCase()}`, 130, 50)

    autoTable(doc, {
      startY: 68,
      head: [['Salary Component', 'Details', 'Amount (INR)']],
      body: [
        ['Gross Base Salary', `${li.days_present} Days Present + ${li.days_leave_paid} Paid Leave`, `₹ ${basePay.toFixed(2)}`],
        [`Mediclaim / Health Deduction`, li.deduction_note || 'Standard Mediclaim Cut', `- ₹ ${deductions.toFixed(2)}`],
        ['Manual Bonus / Additions', li.adjustment_note || 'N/A', `+ ₹ ${adjustments.toFixed(2)}`],
      ],
      foot: [['NET IN-HAND SALARY DISBURSED', '', `₹ ${netPay.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      footStyles: { fillColor: [16, 185, 129] },
    })

    doc.save(`Payslip_${li.employee?.full_name.replace(/\s+/g, '_')}_${runDetails.month}_${runDetails.year}.pdf`)
    toast.success(`Payslip PDF generated for ${li.employee?.full_name}`)
  }

  // Filter line items by search query
  const filteredLineItems = useMemo(() => {
    if (!runDetails) return []
    return runDetails.payroll_line_items.filter((li) => {
      const query = searchQuery.toLowerCase().trim()
      if (!query) return true
      return (
        li.employee?.full_name.toLowerCase().includes(query) ||
        li.employee?.role.toLowerCase().includes(query) ||
        (li.employee?.outlet?.name || '').toLowerCase().includes(query)
      )
    })
  }, [runDetails, searchQuery])

  // Calculated totals
  const totalBasePaySum = runDetails?.payroll_line_items.reduce((acc, curr) => acc + Number(curr.base_pay), 0) || 0
  const totalDeductionsSum = runDetails?.payroll_line_items.reduce((acc, curr) => acc + Number(curr.deductions), 0) || 0
  const totalNetPaySum = runDetails?.payroll_line_items.reduce((acc, curr) => acc + Number(curr.net_pay), 0) || 0

  return (
    <div className="space-y-6">
      {/* Top Toolbar Header: Month Selection + Mediclaim Config Button + Release Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl">
        {/* Month & Year Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-white/10 px-3 py-2 rounded-2xl">
            <Calendar className="w-4 h-4 text-cyan-400 shrink-0" />
            <select
              value={genMonth}
              onChange={(e) => {
                const m = Number(e.target.value)
                setGenMonth(m)
                const existing = runs.find((r) => r.month === m && r.year === genYear)
                if (existing) loadRunDetails(existing.id)
              }}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer"
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
                <option key={m} value={idx + 1} className="bg-slate-900">
                  {m}
                </option>
              ))}
            </select>

            <select
              value={genYear}
              onChange={(e) => {
                const y = Number(e.target.value)
                setGenYear(y)
                const existing = runs.find((r) => r.month === genMonth && r.year === y)
                if (existing) loadRunDetails(existing.id)
              }}
              className="bg-transparent text-xs text-white font-bold focus:outline-none cursor-pointer border-l border-white/10 pl-2"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y} className="bg-slate-900">
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-xs text-slate-950 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 transition-all shadow-lg disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Draft ({genMonth}/{genYear})
          </button>

          <button
            onClick={async () => {
              setIsGenerating(true)
              try {
                const res = await generateDraftPayroll(orgId, genMonth, genYear, mediclaimPct)
                toast.success('Synced all active staff members into payroll!')
                if (res?.runId) await loadRunDetails(res.runId)
                router.refresh()
              } catch (e) {
                toast.error(e instanceof Error ? e.message : 'Failed to sync staff')
              } finally {
                setIsGenerating(false)
              }
            }}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-emerald-400 border border-emerald-500/30 transition-all"
            title="Sync all newly added staff members into current month payroll"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} /> Sync Staff List
          </button>
        </div>

        {/* Action Buttons: Configure Mediclaim Modal + Release Money */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Configure Mediclaim Button (Popup Trigger) */}
          <button
            onClick={() => setIsMediclaimModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-cyan-300 border border-cyan-500/30 transition-all"
          >
            <Settings2 className="w-4 h-4 text-cyan-400" />
            Configure Mediclaim ({mediclaimPct}%)
          </button>

          {/* Export Excel */}
          {runDetails && (
            <button
              onClick={exportToExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-2xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Excel
            </button>
          )}

          {/* Release Money Button */}
          {runDetails && runDetails.status !== 'finalized' && (
            <button
              onClick={handleFinalize}
              disabled={isFinalizing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl font-extrabold text-xs text-white bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-xl disabled:opacity-50"
            >
              {isFinalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Release Money &amp; Send Payslips (₹{totalNetPaySum.toLocaleString('en-IN')})
            </button>
          )}

          {runDetails?.status === 'finalized' && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" /> SALARIES RELEASED
            </span>
          )}
        </div>
      </div>

      {/* Summary Metrics Bar (4 Grid Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Gross Base Salary</span>
          <p className="text-2xl font-extrabold text-white font-mono mt-1">
            ₹{totalBasePaySum.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Total earned before deductions</span>
        </div>

        <div className="p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 shadow-xl">
          <span className="text-[11px] font-bold text-rose-400 uppercase flex items-center gap-1">
            <Percent className="w-3.5 h-3.5" /> Mediclaim Cut ({mediclaimPct}%)
          </span>
          <p className="text-2xl font-extrabold text-rose-300 font-mono mt-1">
            -₹{totalDeductionsSum.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-rose-400/80 mt-1 block">Health Insurance Medical Deduction</span>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 shadow-xl">
          <span className="text-[11px] font-bold text-emerald-400 uppercase">Net Salary In-Hand</span>
          <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            ₹{totalNetPaySum.toLocaleString('en-IN')}
          </p>
          <span className="text-[10px] text-emerald-400/80 mt-1 block">Disbursed directly to staff</span>
        </div>

        <div className="p-5 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Employees Disbursed</span>
          <p className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
            {runDetails?.payroll_line_items.length || 0} Staff
          </p>
          <span className="text-[10px] text-slate-500 mt-1 block">Ready to receive payslips</span>
        </div>
      </div>

      {/* Main Employee Payroll Salary Table Rendered Directly on Page */}
      <div className="rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden shadow-2xl space-y-4">
        {/* Table Search & Title Header */}
        <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <IndianRupee className="w-5 h-5 text-emerald-400" /> Employee Monthly Salary Breakdown (
              {filteredLineItems.length})
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Showing salaries for Month {genMonth}/{genYear}. Click &quot;Send Payslip&quot; to send individual statement to employee profile.
            </p>
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name or outlet..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Employee Table */}
        {isLoadingDetails ? (
          <div className="py-20 text-center text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-cyan-400" />
            <p className="text-xs font-semibold">Loading payroll breakdown for this month...</p>
          </div>
        ) : filteredLineItems.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <FileText className="w-12 h-12 mx-auto text-slate-600 opacity-50" />
            <p className="text-sm font-semibold">No payroll records found for selected month or search query.</p>
            <button
              onClick={handleGenerate}
              className="text-xs font-bold text-cyan-400 hover:underline"
            >
              Generate Draft for Month {genMonth}/{genYear}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="text-[11px] uppercase text-slate-400 font-bold bg-slate-950/80 border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Outlet Location</th>
                  <th className="px-6 py-4">Attendance</th>
                  <th className="px-6 py-4">Gross Base Salary</th>
                  <th className="px-6 py-4">Mediclaim Cut ({mediclaimPct}%)</th>
                  <th className="px-6 py-4">Bonus / Adj</th>
                  <th className="px-6 py-4">Net Salary In-Hand</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLineItems.map((li) => {
                  const theme = getOutletColor(li.employee?.outlet?.name)
                  const basePay = Number(li.base_pay) || 0
                  const deductions = Number(li.deductions) || 0
                  const manual = Number(li.manual_adjustments) || 0
                  const netPay = Number(li.net_pay) || 0
                  const isFinalized = runDetails?.status === 'finalized'

                  return (
                    <tr key={li.id} className="hover:bg-white/[0.03] transition-colors group">
                      {/* Employee Avatar & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow text-xs shrink-0 border border-white/20"
                            style={{ background: theme.gradient }}
                          >
                            {li.employee?.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                              {li.employee?.full_name}
                            </p>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {li.employee?.role}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Outlet Badge */}
                      <td className="px-6 py-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold"
                          style={{
                            background: theme.badgeBg,
                            color: theme.badgeText,
                            border: `1px solid ${theme.badgeBorder}`,
                          }}
                        >
                          <span className="w-2 h-2 rounded-full" style={{ background: theme.dot }} />
                          {li.employee?.outlet?.name || 'Main'}
                        </span>
                      </td>

                      {/* Attendance Breakdown */}
                      <td className="px-6 py-4 font-mono">
                        <span className="text-emerald-400 font-bold">{li.days_present}P</span> /{' '}
                        <span className="text-cyan-400 font-bold">{li.days_leave_paid}L</span> /{' '}
                        <span className="text-rose-400 font-bold">{li.days_absent_unexcused}A</span>
                      </td>

                      {/* Gross Base Salary */}
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-white">
                        ₹{basePay.toLocaleString('en-IN')}
                      </td>

                      {/* Mediclaim Cut */}
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-rose-400">
                        -₹{deductions.toLocaleString('en-IN')}
                      </td>

                      {/* Manual Bonus / Adjustments */}
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-cyan-400">
                        {manual >= 0 ? `+₹${manual}` : `-₹${Math.abs(manual)}`}
                      </td>

                      {/* Net Salary In-Hand */}
                      <td className="px-6 py-4 font-mono text-base font-extrabold text-emerald-400">
                        ₹{netPay.toLocaleString('en-IN')}
                      </td>

                      {/* Status Badge */}
                      <td className="px-6 py-4">
                        {isFinalized ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> DISBURSED
                          </span>
                        ) : (li as unknown as { is_sent?: boolean })?.is_sent || li.adjustment_note?.includes('Sent') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30">
                            <Send className="w-3 h-3" /> SENT TO PROFILE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" /> DRAFT
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Send Payslip to Staff Profile Button */}
                          <button
                            onClick={() => handleSendPayslip(li)}
                            disabled={sendingId === li.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 font-bold text-xs border border-emerald-500/30 transition-all shadow-md disabled:opacity-50"
                            title="Send payslip directly to staff profile"
                          >
                            {sendingId === li.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5" />
                            )}
                            Send to Staff
                          </button>

                          {/* Download Payslip PDF */}
                          <button
                            onClick={() => downloadSinglePDF(li)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs border border-cyan-500/20 transition-all"
                            title="Download PDF Payslip"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>

                          {/* Edit Adjustments */}
                          {!isFinalized && (
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
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs border border-white/10"
                            >
                              Edit Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* POPUP MODAL 1: MEDICLAIM DEDUCTION CONFIGURATOR */}
      <Dialog.Root open={isMediclaimModalOpen} onOpenChange={setIsMediclaimModalOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-3xl shadow-2xl p-6 space-y-5 z-50">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="w-5 h-5 text-cyan-400" />
                <Dialog.Title className="text-lg font-extrabold text-white">
                  Configure Mediclaim Deductions
                </Dialog.Title>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Choose the percentage cut for employee Mediclaim health insurance policy. This percentage will automatically calculate mediclaim deductions from base salaries.
              </p>

              <div>
                <label className="block text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
                  Deduction Percentage (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={mediclaimPct}
                    onChange={(e) => setMediclaimPct(Math.max(0, Math.min(50, Number(e.target.value))))}
                    className="w-full bg-slate-950 border border-cyan-500/40 rounded-xl px-4 py-2.5 text-base text-white font-mono font-bold focus:outline-none"
                  />
                  <div className="flex gap-1 shrink-0">
                    {[10, 15, 20].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setMediclaimPct(pct)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
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

              {/* Example calculation preview inside modal */}
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-200 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <HelpCircle className="w-4 h-4 text-cyan-400" /> Calculation Preview:
                </div>
                <p>
                  Base Salary: <strong>₹10,000</strong>
                </p>
                <p>
                  Mediclaim Cut ({mediclaimPct}%): <strong className="text-rose-400">-₹{((10000 * mediclaimPct) / 100).toLocaleString('en-IN')}</strong>
                </p>
                <p>
                  Net In-Hand Salary: <strong className="text-emerald-400">₹{(10000 - (10000 * mediclaimPct) / 100).toLocaleString('en-IN')}</strong>
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setIsMediclaimModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-extrabold text-xs hover:bg-cyan-400 transition-colors shadow-lg"
              >
                Apply Percentage ({mediclaimPct}%)
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* POPUP MODAL 2: EDIT SALARY ADJUSTMENTS */}
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
