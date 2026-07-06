'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitLeaveRequest } from '@/app/actions/leave'
import { Loader2, Calendar, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { LeaveBalance } from '@/lib/types/database'

interface LeaveRequestFormProps {
  employeeId: string
  balances: LeaveBalance[]
}

export function LeaveRequestForm({ employeeId, balances }: LeaveRequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [typeId, setTypeId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reason, setReason] = useState('')

  const selectedBalance = balances.find((b) => b.leave_type_id === typeId)
  
  let showWarning = false
  if (selectedBalance && selectedBalance.leave_type?.annual_allocation_days !== 0) {
    const remaining = selectedBalance.allocated_days - Number(selectedBalance.used_days)
    
    // Estimate days requested (calendar days)
    if (startDate && endDate) {
      const s = new Date(startDate)
      const e = new Date(endDate)
      if (s <= e) {
        const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
        if (diff > remaining) {
          showWarning = true
        }
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!typeId || !startDate || !endDate || !reason) {
      toast.error('Please fill in all fields')
      return
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('End date cannot be before start date')
      return
    }

    setIsSubmitting(true)
    try {
      await submitLeaveRequest(employeeId, typeId, startDate, endDate, reason)
      toast.success('Leave request submitted successfully')
      
      // Reset form
      setTypeId('')
      setStartDate('')
      setEndDate('')
      setReason('')
      
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="geo-card space-y-4">
      <h2 className="text-lg font-semibold text-white mb-4">Request Leave</h2>
      
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Leave Type</label>
        <select
          value={typeId}
          onChange={(e) => setTypeId(e.target.value)}
          required
          className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-accent appearance-none text-sm"
        >
          <option value="" disabled>Select a leave type</option>
          {balances.map((b) => {
            const t = b.leave_type
            if (!t) return null
            const remaining = b.allocated_days - Number(b.used_days)
            const label = t.annual_allocation_days > 0 
              ? `${t.name} (${remaining} of ${b.allocated_days} days remaining)`
              : `${t.name} (Unpaid)`
            return (
              <option key={t.id} value={t.id}>{label}</option>
            )
          })}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">Start Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm [color-scheme:dark]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none focus:border-accent text-sm [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-400 mb-1.5">Reason</label>
        <textarea
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Please provide a brief reason..."
          className="w-full bg-[#0F172A] border border-[#1E293B] rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-accent text-sm h-24 resize-none"
        />
      </div>

      {showWarning && (
        <div className="bg-warning/10 border border-warning/20 text-warning px-4 py-3 rounded-xl text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            You are requesting more days than your remaining balance. This request may be rejected by your manager, or recorded as unpaid leave.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
      </button>
    </form>
  )
}
