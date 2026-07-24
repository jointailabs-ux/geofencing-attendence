'use client'

import { formatISTTime, formatISTTimeFull } from '@/lib/utils'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { resolveAttendanceFlag } from '@/app/actions/attendance'
import type { DailySummary } from '@/app/actions/attendance'
import { AlertTriangle, MapPin, Check, UserCheck, FileDown, Loader2, ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import type { AttendanceLog } from '@/lib/types/database'

interface DailySummaryTableProps {
  summaries: DailySummary[]
  dateStr: string
  isAdmin?: boolean
}

export function DailySummaryTable({ summaries, dateStr, isAdmin = false }: DailySummaryTableProps) {
  const router = useRouter()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  
  // Resolution Dialog State
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)
  const [resolveReason, setResolveReason] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolveType, setResolveType] = useState<'valid' | 'manual_override'>('valid')

  const toggleExpand = (empId: string) => {
    setExpandedId(prev => prev === empId ? null : empId)
  }

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedLog) return

    if (resolveReason.trim().length < 5) {
      toast.error('Please provide a descriptive reason.')
      return
    }

    setIsResolving(true)
    try {
      await resolveAttendanceFlag(selectedLog.id, resolveType, resolveReason)
      toast.success('Attendance record updated successfully')
      setSelectedLog(null)
      setResolveReason('')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update record')
    } finally {
      setIsResolving(false)
    }
  }

  const exportCSV = () => {
    const headers = ['Employee', 'Role', 'Outlet', 'First Check-in', 'Last Check-out', 'Total Hours', 'Has Flags']
    
    const rows = summaries.map(s => {
      const firstIn = s.first_check_in ? formatISTTimeFull(s.first_check_in) : '-'
      const lastOut = s.last_check_out ? formatISTTimeFull(s.last_check_out) : '-'
      return `"${s.employee_name}","${s.role}","${s.outlet_name}","${firstIn}","${lastOut}","${s.total_hours.toFixed(2)}","${s.has_flags ? 'Yes' : 'No'}"`
    })
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join('\n'), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `attendance_summary_${dateStr}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (summaries.length === 0) {
    return (
      <div className="rounded-3xl p-12 text-center bg-white/[0.02] border border-white/5 backdrop-blur-md text-slate-400">
        <UserCheck className="w-16 h-16 mx-auto mb-4 opacity-20" />
        <p className="text-lg font-medium">No attendance records found for this date.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={exportCSV}
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 px-5 py-2.5 rounded-xl transition-all border border-white/10 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          <FileDown className="w-4 h-4" />
          Export Daily Summary
        </button>
      </div>

      <div className="rounded-3xl overflow-hidden bg-white/[0.02] border border-white/10 backdrop-blur-xl shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-white/10">
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Timeline</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Hours Worked</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-5 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {summaries.map((summary) => (
                <React.Fragment key={summary.employee_id}>
                  {/* Summary Row */}
                  <tr 
                    onClick={() => toggleExpand(summary.employee_id)}
                    className={`group cursor-pointer hover:bg-white/[0.04] transition-colors ${summary.has_flags ? 'bg-rose-500/[0.02]' : ''}`}
                  >
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-white border border-slate-700 shadow-inner"
                          style={{
                            background: summary.role === 'manager' ? 'linear-gradient(135deg, #06b6d4, #3b82f6)' :
                                        summary.role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' :
                                        'linear-gradient(135deg, #10b981, #059669)'
                          }}>
                          {summary.employee_name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-white group-hover:text-slate-200 transition-colors">{summary.employee_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">{summary.role}</span>
                            {isAdmin && (
                              <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {summary.outlet_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="p-5">
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                          <span className="font-mono">{summary.first_check_in ? formatISTTime(summary.first_check_in) : '--:--'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <span className="inline-block w-2 h-2 rounded-full bg-slate-500"></span>
                          <span className="font-mono">{summary.last_check_out ? formatISTTime(summary.last_check_out) : '--:--'}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-5">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-white tracking-tight">{Math.floor(summary.total_hours)}</span>
                        <span className="text-sm font-medium text-slate-400">h</span>
                        <span className="text-2xl font-bold text-white tracking-tight ml-1">{Math.round((summary.total_hours % 1) * 60)}</span>
                        <span className="text-sm font-medium text-slate-400">m</span>
                      </div>
                    </td>

                    <td className="p-5">
                      {summary.has_flags ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Action Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <Check className="w-3.5 h-3.5" /> All Valid
                        </span>
                      )}
                    </td>

                    <td className="p-5 text-right">
                      <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5 text-slate-300">
                        {expandedId === summary.employee_id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Raw Logs Details */}
                  {expandedId === summary.employee_id && (
                    <tr className="bg-black/20 border-b border-white/10 shadow-inner">
                      <td colSpan={5} className="p-6">
                        <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4">
                          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            Raw Timeline ({summary.raw_logs.length} entries)
                          </h4>
                          
                          <div className="space-y-2">
                            {summary.raw_logs.map((log) => (
                              <div key={log.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${log.status === 'flagged' ? 'bg-rose-500/5 border-rose-500/20' : 'bg-white/5 border-white/5'}`}>
                                <div className="flex items-center gap-4">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${log.type === 'check_in' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                                    {log.type === 'check_in' ? 'Check In' : 'Check Out'}
                                  </span>
                                  <span className="text-slate-300 font-mono text-sm">
                                    {formatISTTime(log.timestamp)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                    <MapPin className="w-3.5 h-3.5" />
                                    {log.distance_from_outlet_meters}m
                                  </div>
                                  
                                  <div className="flex items-center gap-3 min-w-[150px] justify-end">
                                    <StatusBadge 
                                      variant={log.status === 'valid' ? 'active' : log.status === 'flagged' ? 'flagged' : 'manager'} 
                                      label={log.status === 'valid' ? 'Valid' : log.status === 'flagged' ? 'Flagged' : 'Overridden'}
                                      size="sm" 
                                    />
                                    {log.status === 'flagged' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setSelectedLog(log);
                                        }}
                                        className="inline-flex items-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold px-2.5 py-1 rounded-lg transition-colors border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.1)]"
                                      >
                                        Resolve
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flag Resolution Modal */}
      <Dialog.Root open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-white/10 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-50 p-6 animate-fade-in-up">
            <Dialog.Title className="text-xl font-bold text-white mb-2">
              Review Flagged Record
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-400 mb-6 leading-relaxed">
              <span className="font-bold text-white">{selectedLog?.employee?.full_name}</span> attempted to {selectedLog?.type === 'check_in' ? 'check in' : 'check out'} from a distance of <span className="font-bold text-rose-400">{selectedLog?.distance_from_outlet_meters}m</span>, which exceeds the geofence limit.
            </Dialog.Description>

            <form onSubmit={handleResolve} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Resolution Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolveType('valid')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      resolveType === 'valid'
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolveType('manual_override')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                      resolveType === 'manual_override'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" /> Override
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Reason (Required)</label>
                <textarea
                  required
                  minLength={5}
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  placeholder="e.g. Employee forgot phone, approved manually."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm resize-none h-24 transition-colors"
                />
              </div>

              <div className="flex justify-end gap-3 pt-5 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                >
                  {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  )
}
