import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getManagerDashboardStats } from '@/app/actions/dashboard'
import { CalendarOff, Building2, UserCheck, AlertCircle, Clock, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manager Dashboard' }

export default async function ManagerDashboardPage() {
  const employee = await getCachedEmployee()
  if (!employee || !employee.outlet_id) redirect('/login')

  const outletName = employee.outlets?.name ?? 'Your Outlet'
  const { metrics, roster } = await getManagerDashboardStats(employee.outlet_id)

  return (
    <div className="animate-fade-in space-y-6 pb-6">
      <div className="page-header">
        <h1 className="page-title text-3xl">Dashboard</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-6 h-6 rounded flex items-center justify-center bg-cyan-500/20 text-cyan-400">
            <Building2 className="w-3.5 h-3.5" />
          </div>
          <p className="page-subtitle text-base m-0 text-white font-medium">{outletName}</p>
        </div>
      </div>

      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Large Stat */}
        <div className="sm:col-span-2 rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(10,15,30,0.9))', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <UserCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">Active Shift</span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-bold tracking-tighter text-white">{metrics.presentCount}</span>
              <span className="text-lg text-slate-400 font-medium mb-1">/ {metrics.staffCount} Present Today</span>
            </div>
          </div>
        </div>

        {/* Small Stat */}
        <div className="rounded-3xl p-6 flex flex-col justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full pointer-events-none" />
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <CalendarOff className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm font-semibold text-amber-400 uppercase tracking-widest">Leaves</span>
          </div>
          <div className="relative z-10">
            <p className="text-5xl font-bold tracking-tighter text-white">{metrics.pendingLeaves}</p>
            <p className="text-sm text-slate-400 font-medium mt-1">Pending Requests</p>
          </div>
        </div>
      </div>

      {/* Bento Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Quick Actions (Bento Box) */}
        <div className="space-y-4">
          <a href="/manager/leave" className="group block rounded-3xl p-6 bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 to-violet-500/5 group-hover:to-violet-500/10 transition-colors" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">Review Leaves</h3>
                <p className="text-sm text-slate-400 mt-1">Approve/Reject requests</p>
              </div>
              <ArrowRight className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
          
          <a href="/manager/attendance" className="group block rounded-3xl p-6 bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/5 group-hover:to-cyan-500/10 transition-colors" />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">View Logs</h3>
                <p className="text-sm text-slate-400 mt-1">Check today&apos;s history</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>

        {/* Live Roster */}
        <div className="lg:col-span-2 rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden flex flex-col">
          <div className="p-6 flex justify-between items-center bg-white/[0.01] border-b border-white/5">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Roster
            </h2>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <tbody className="divide-y divide-white/5">
                {roster.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{emp.name}</span>
                            {emp.flagged && <AlertCircle className="w-3.5 h-3.5 text-red-400" />}
                          </div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider">{emp.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {emp.status === 'checked_in' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          IN
                        </span>
                      ) : emp.status === 'checked_out' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          OUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-900 text-slate-600 border border-slate-800 border-dashed">
                          ABSENT
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {emp.lastLogTime ? (
                        <div className="flex items-center justify-end gap-2 text-xs font-mono text-slate-400">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {new Date(emp.lastLogTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
