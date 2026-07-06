'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { resolveAttendanceFlag } from '@/app/actions/attendance'
import { AlertTriangle, MapPin, Check, UserCheck, FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { AttendanceLog } from '@/lib/types/database'
import * as Dialog from '@radix-ui/react-dialog'

interface AttendanceTableProps {
  logs: AttendanceLog[]
  outletName: string
  isAdmin?: boolean
}

export function AttendanceTable({ logs, outletName, isAdmin = false }: AttendanceTableProps) {
  const router = useRouter()
  const [selectedLog, setSelectedLog] = useState<AttendanceLog | null>(null)
  const [resolveReason, setResolveReason] = useState('')
  const [isResolving, setIsResolving] = useState(false)
  const [resolveType, setResolveType] = useState<'valid' | 'manual_override'>('valid')

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
    const headers = isAdmin 
      ? ['Employee,Role,Outlet,Type,Time,Status,Distance,Override Reason']
      : ['Employee,Role,Type,Time,Status,Distance,Override Reason']
    
    const rows = logs.map(log => {
      if (isAdmin) {
        return `"${log.employee?.full_name}","${log.employee?.role}","${log.outlet?.name || ''}","${log.type}","${new Date(log.timestamp).toLocaleTimeString('en-IN')}","${log.status}","${log.distance_from_outlet_meters}m","${log.override_reason || ''}"`
      }
      return `"${log.employee?.full_name}","${log.employee?.role}","${log.type}","${new Date(log.timestamp).toLocaleTimeString('en-IN')}","${log.status}","${log.distance_from_outlet_meters}m","${log.override_reason || ''}"`
    })
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join('\n'), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `attendance_${outletName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (logs.length === 0) {
    return (
      <div className="geo-card text-center py-12 text-slate-400">
        <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-20" />
        <p>No attendance records for today yet.</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button 
          onClick={exportCSV}
          className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-white bg-[#1E293B] hover:bg-[#334155] px-4 py-2 rounded-lg transition-colors border border-[#334155]"
        >
          <FileDown className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="geo-card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1E293B]/50 border-b border-[#1E293B]">
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Employee</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Time</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Distance</th>
                <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {logs.map((log) => (
                <tr key={log.id} className={`hover:bg-[#1E293B]/30 transition-colors ${log.status === 'flagged' ? 'bg-warning/5' : ''}`}>
                  <td className="p-4">
                    <p className="font-semibold text-white">{log.employee?.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">{log.employee?.role}</span>
                      {isAdmin && log.outlet?.name && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-xs text-slate-400">{log.outlet.name}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${log.type === 'check_in' ? 'bg-accent/10 text-accent border-accent/20' : 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {log.type === 'check_in' ? 'Check In' : 'Check Out'}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <StatusBadge 
                        variant={log.status === 'valid' ? 'active' : log.status === 'flagged' ? 'flagged' : 'manager'} 
                        label={log.status === 'valid' ? 'Valid' : log.status === 'flagged' ? 'Flagged' : 'Overridden'}
                        size="sm" 
                      />
                      {log.override_reason && (
                        <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={log.override_reason}>
                          {log.override_reason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3 h-3" />
                      {log.distance_from_outlet_meters}m
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {log.status === 'flagged' && (
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1.5 bg-warning/20 hover:bg-warning/30 text-warning text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-warning/30"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Review
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog.Root open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-[#0F172A]/80 backdrop-blur-sm z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0F172A] border border-[#334155] rounded-2xl shadow-2xl z-50 p-6 animate-fade-in">
            <Dialog.Title className="text-xl font-bold text-white mb-2">
              Review Flagged Attendance
            </Dialog.Title>
            <Dialog.Description className="text-sm text-slate-400 mb-6">
              {selectedLog?.employee?.full_name} attempted to {selectedLog?.type === 'check_in' ? 'check in' : 'check out'} from a distance of {selectedLog?.distance_from_outlet_meters}m, which exceeds the geofence limit.
            </Dialog.Description>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Action</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setResolveType('valid')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      resolveType === 'valid'
                        ? 'bg-valid/20 border-valid text-valid'
                        : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:bg-[#334155]'
                    }`}
                  >
                    <Check className="w-4 h-4" /> Approve Location
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolveType('manual_override')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-colors ${
                      resolveType === 'manual_override'
                        ? 'bg-accent/20 border-accent text-accent'
                        : 'bg-[#1E293B] border-[#334155] text-slate-400 hover:bg-[#334155]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" /> Manual Override
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Reason for Override (Required)</label>
                <textarea
                  required
                  minLength={5}
                  value={resolveReason}
                  onChange={(e) => setResolveReason(e.target.value)}
                  placeholder="e.g. Employee forgot phone, approved manually."
                  className="w-full bg-[#1E293B] border border-[#334155] rounded-xl p-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent text-sm resize-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm {resolveType === 'valid' ? 'Approval' : 'Override'}
                </button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
