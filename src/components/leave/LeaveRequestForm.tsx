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

  const inputStyle = {
    background: 'rgba(10, 15, 30, 0.6)',
    border: '1px solid rgba(139, 92, 246, 0.1)',
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
          className="w-full rounded-xl px-4 py-2.5 text-white focus:outline-none appearance-none text-sm transition-all duration-300"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.1)'; e.target.style.boxShadow = 'none'; }}
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
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none text-sm [color-scheme:dark] transition-all duration-300"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.1)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1.5">End Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400" />
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full rounded-xl pl-9 pr-4 py-2.5 text-white focus:outline-none text-sm [color-scheme:dark] transition-all duration-300"
              style={inputStyle}
              onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.1)'; e.target.style.boxShadow = 'none'; }}
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
          className="w-full rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none text-sm h-24 resize-none transition-all duration-300"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'rgba(139, 92, 246, 0.1)'; e.target.style.boxShadow = 'none'; }}
        />
      </div>

      {showWarning && (
        <div className="px-4 py-3 rounded-xl text-sm flex items-start gap-2"
          style={{
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.15)',
            color: '#fbbf24',
          }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            You are requesting more days than your remaining balance. This request may be rejected by your manager, or recorded as unpaid leave.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full text-white font-semibold py-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 flex justify-center items-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #8B5CF6, #06B6D4)',
          boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
        }}
      >
        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
      </button>
    </form>
  )
}
