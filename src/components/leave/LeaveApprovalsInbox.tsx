'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { resolveLeaveRequest } from '@/app/actions/leave'
import { Check, X, Calendar, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { LeaveRequest } from '@/lib/types/database'
import * as Dialog from '@radix-ui/react-dialog'

export function LeaveApprovalsInbox({ requests, currentUserId }: { requests: LeaveRequest[], currentUserId: string }) {
  const router = useRouter()
  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null)
  const [actionType, setActionType] = useState<'approved' | 'rejected'>('approved')
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq) return

    if (actionType === 'rejected' && comment.trim().length < 5) {
      toast.error('Please provide a reason for rejecting the request.')
      return
    }

    setIsSubmitting(true)
    try {
      await resolveLeaveRequest(selectedReq.id, actionType, comment, currentUserId)
      toast.success(`Request ${actionType} successfully`)
      setSelectedReq(null)
      setComment('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resolve request')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (requests.length === 0) {
    return (
      <div className="geo-card text-center py-12 text-slate-400">
        <Check className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No pending leave requests to review.</p>
        <p className="text-sm mt-1">You&apos;re all caught up!</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {requests.map((r) => {
          const s = new Date(r.start_date)
          const e = new Date(r.end_date)
          const diffDays = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1
          
          return (
            <div key={r.id} className="geo-card !p-5 flex flex-col h-full border border-accent/20 bg-accent/5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-white text-lg">{r.employee?.full_name}</h3>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{r.employee?.role}</p>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 bg-accent/20 text-accent px-2 py-0.5 rounded text-xs font-semibold">
                    {r.leave_type?.name}
                  </span>
                  <p className="text-xs text-slate-500 mt-1">{diffDays} day{diffDays > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-300 mb-3 bg-[#0F172A] p-2 rounded-lg border border-[#1E293B]">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>
                  {s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  {' - '}
                  {e.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="text-sm text-slate-400 mb-6 flex-grow">
                <span className="text-slate-500">Reason:</span> {r.reason}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-auto">
                <button
                  onClick={() => {
                    setSelectedReq(r)
                    setActionType('rejected')
                  }}
                  className="flex items-center justify-center gap-1.5 text-danger bg-danger/10 hover:bg-danger/20 border border-danger/20 py-2 rounded-xl transition-colors text-sm font-semibold"
                >
                  <X className="w-4 h-4" /> Reject
                </button>
                <button
                  onClick={() => {
                    setSelectedReq(r)
                    setActionType('approved')
                  }}
                  className="flex items-center justify-center gap-1.5 text-valid bg-valid/10 hover:bg-valid/20 border border-valid/20 py-2 rounded-xl transition-colors text-sm font-semibold"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Dialog.Root open={!!selectedReq} onOpenChange={(open) => !open && setSelectedReq(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl z-50 p-6 animate-fade-in">
            <Dialog.Title className="text-xl font-bold text-white mb-2">
              {actionType === 'approved' ? 'Approve' : 'Reject'} Leave Request
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-400 mb-6">
              You are about to {actionType} the leave request from <strong className="text-white">{selectedReq?.employee?.full_name}</strong>.
            </Dialog.Description>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Comment {actionType === 'rejected' && <span className="text-danger">*</span>}
                </label>
                <textarea
                  required={actionType === 'rejected'}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={actionType === 'rejected' ? 'Please explain why this request is rejected...' : 'Optional comment for the employee...'}
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm resize-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setSelectedReq(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex items-center gap-2 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                    actionType === 'approved' ? 'bg-valid hover:bg-valid-dark' : 'bg-danger hover:bg-danger/90'
                  }`}
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm {actionType === 'approved' ? 'Approval' : 'Rejection'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
