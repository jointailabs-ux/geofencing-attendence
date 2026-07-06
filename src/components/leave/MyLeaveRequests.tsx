'use client'

import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { cancelLeaveRequest } from '@/app/actions/leave'
import { XCircle, Calendar, MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import type { LeaveRequest } from '@/lib/types/database'

export function MyLeaveRequests({ requests, employeeId }: { requests: LeaveRequest[], employeeId: string }) {
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) return
    
    setCancellingId(id)
    try {
      await cancelLeaveRequest(id, employeeId)
      toast.success('Leave request cancelled')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel request')
    } finally {
      setCancellingId(null)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="geo-card text-center py-12 text-slate-400">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>You haven&apos;t made any leave requests yet.</p>
      </div>
    )
  }

  return (
    <div className="geo-card !p-0 overflow-hidden">
      <div className="p-4 border-b border-[#1E293B]">
        <h2 className="text-lg font-semibold text-white">My Leave Requests</h2>
      </div>
      
      <div className="divide-y divide-[#1E293B]">
        {requests.map((r) => {
          const isPending = r.status === 'pending'
          return (
            <div key={r.id} className="p-4 sm:p-5 hover:bg-[#1E293B]/30 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-white">{r.leave_type?.name}</span>
                    <StatusBadge 
                      variant={r.status === 'approved' ? 'active' : r.status === 'rejected' ? 'absent' : 'pending'} 
                      label={r.status === 'approved' ? 'Approved' : r.status === 'rejected' ? 'Rejected' : 'Pending'} 
                    />
                  </div>
                  <div className="text-sm text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {new Date(r.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    {' - '}
                    {new Date(r.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>

                {isPending && (
                  <button
                    onClick={() => handleCancel(r.id)}
                    disabled={cancellingId === r.id}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-danger transition-colors bg-[#0F172A] px-3 py-1.5 rounded-lg border border-[#1E293B] hover:border-danger/30"
                  >
                    {cancellingId === r.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    Cancel
                  </button>
                )}
              </div>

              <div className="bg-[#0F172A] rounded-lg p-3 border border-[#1E293B]">
                <p className="text-sm text-slate-300">
                  <span className="text-slate-500 font-medium">Reason: </span>
                  {r.reason}
                </p>
              </div>

              {r.manager_comment && (
                <div className="mt-2 bg-[#1E293B]/50 rounded-lg p-3 border border-[#334155] flex items-start gap-2">
                  <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-0.5">
                      Manager Note <span className="font-normal text-slate-500">({r.approver?.full_name})</span>
                    </p>
                    <p className="text-sm text-slate-400">{r.manager_comment}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
