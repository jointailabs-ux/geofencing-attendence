'use client'

import jsPDF from 'jspdf'
import { IndianRupee, Download, CheckCircle2, Percent } from 'lucide-react'

interface PayslipItem {
  id: string
  base_pay: number | string
  deductions: number | string
  net_pay: number | string
  manual_adjustments: number | string
  days_present: number
  days_leave_paid: number
  deduction_note?: string
}

interface StaffPayslipCardProps {
  item: PayslipItem
  run?: { year: number; month: number; finalized_at?: string }
  employeeName: string
  role: string
  outletName: string
}

export function StaffPayslipCard({ item, run, employeeName, role, outletName }: StaffPayslipCardProps) {
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

  const monthStr = run ? monthNames[run.month - 1] : 'Monthly'
  const yearStr = run ? run.year : new Date().getFullYear()

  const basePay = Number(item.base_pay) || 0
  const deductions = Number(item.deductions) || 0
  const netPay = Number(item.net_pay) || 0
  const adjustments = Number(item.manual_adjustments) || 0

  const handleDownloadPDF = () => {
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setTextColor(16, 185, 129)
    doc.text('GeoAttend Official Salary Statement', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Pay Period: ${monthStr} ${yearStr}`, 105, 27, { align: 'center' })

    doc.setFontSize(12)
    doc.setTextColor(15, 23, 42)
    doc.text(`Employee Name: ${employeeName}`, 20, 42)
    doc.text(`Role: ${role.toUpperCase()}`, 20, 50)
    doc.text(`Outlet Location: ${outletName}`, 20, 58)

    doc.text(`Status: RELEASED & DISBURSED`, 130, 42)
    doc.text(`Issued Date: ${new Date().toLocaleDateString()}`, 130, 50)

    doc.setLineWidth(0.5)
    doc.setDrawColor(226, 232, 240)
    doc.line(20, 65, 190, 65)

    doc.setFontSize(14)
    doc.setTextColor(16, 185, 129)
    doc.text('Earnings & Deductions Summary', 20, 75)

    doc.setFontSize(11)
    doc.setTextColor(51, 65, 85)
    doc.text(`Gross Base Salary:`, 20, 88)
    doc.text(`Rs. ${basePay.toLocaleString('en-IN')}`, 150, 88, { align: 'right' })

    doc.setTextColor(225, 29, 72)
    doc.text(`Mediclaim Deduction:`, 20, 98)
    doc.text(`- Rs. ${deductions.toLocaleString('en-IN')}`, 150, 98, { align: 'right' })

    if (adjustments !== 0) {
      doc.setTextColor(14, 165, 233)
      doc.text(`Bonus / Adjustments:`, 20, 108)
      doc.text(
        `${adjustments >= 0 ? '+' : '-'} Rs. ${Math.abs(adjustments).toLocaleString('en-IN')}`,
        150,
        108,
        { align: 'right' }
      )
    }

    doc.line(20, 115, 190, 115)

    doc.setFontSize(14)
    doc.setTextColor(16, 185, 129)
    doc.text(`Net In-Hand Disbursed:`, 20, 126)
    doc.text(`Rs. ${netPay.toLocaleString('en-IN')}`, 150, 126, { align: 'right' })

    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    doc.text(`Attendance Days Present: ${item.days_present} Days`, 20, 142)
    doc.text(`Paid Leave Days: ${item.days_leave_paid} Days`, 20, 150)

    doc.setFontSize(9)
    doc.setTextColor(148, 163, 184)
    doc.text('This is a computer-generated salary statement issued by GeoAttend System.', 105, 175, {
      align: 'center',
    })

    doc.save(`Payslip_${employeeName.replace(/\s+/g, '_')}_${monthStr}_${yearStr}.pdf`)
  }

  return (
    <div className="rounded-3xl p-6 bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all shadow-xl space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg">
              {monthStr} {yearStr} Payslip
            </h3>
            <p className="text-xs text-slate-400">
              Released by Admin on {run?.finalized_at ? new Date(run.finalized_at).toLocaleDateString() : 'Current Month'}
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
          <span className="font-bold text-white text-base mt-0.5 block">₹{basePay.toLocaleString('en-IN')}</span>
        </div>

        <div>
          <span className="text-[10px] text-rose-400 uppercase block font-sans flex items-center gap-1">
            <Percent className="w-3 h-3" /> Mediclaim Deduction
          </span>
          <span className="font-bold text-rose-400 text-base mt-0.5 block">
            -₹{deductions.toLocaleString('en-IN')}
          </span>
          <span className="text-[9px] text-slate-500 font-sans">{item.deduction_note || 'Mediclaim Cut'}</span>
        </div>

        <div>
          <span className="text-[10px] text-emerald-400 uppercase block font-sans">Net Salary In-Hand</span>
          <span className="font-extrabold text-emerald-400 text-lg mt-0.5 block">
            ₹{netPay.toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Footer Details & PDF Download Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400 pt-1">
        <div className="flex items-center gap-4">
          <span>
            Days Worked: <strong className="text-white">{item.days_present} Days</strong>
          </span>
          <span>
            Paid Leave: <strong className="text-white">{item.days_leave_paid} Days</strong>
          </span>
        </div>

        <button
          onClick={handleDownloadPDF}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 transition-all shadow-md"
        >
          <Download className="w-4 h-4" /> Download PDF Payslip
        </button>
      </div>
    </div>
  )
}
