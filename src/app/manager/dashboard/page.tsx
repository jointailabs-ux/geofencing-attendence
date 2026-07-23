import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getManagerDashboardStats } from '@/app/actions/dashboard'
import {
  CalendarOff,
  Building2,
  UserCheck,
  AlertCircle,
  Clock,
  ArrowRight,
  Play,
  LogOut,
  Zap,
  Coffee,
  Pause,
  ShieldCheck,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manager Dashboard - GeoAttend' }

export default async function ManagerDashboardPage() {
  const employee = await getCachedEmployee()
  if (!employee || !employee.outlet_id) redirect('/login')

  const outletName = employee.outlets?.name ?? 'Your Outlet'
  const { metrics, roster } = await getManagerDashboardStats(employee.outlet_id)

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="page-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl sm:text-4xl font-extrabold text-white">Outlet Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Building2 className="w-4 h-4" />
            </div>
            <p className="page-subtitle text-base m-0 text-white font-bold">{outletName}</p>
          </div>
        </div>

        <a
          href="/manager/attendance"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
        >
          <Clock className="w-4 h-4 text-cyan-400" /> View Attendance Logs
        </a>
      </div>

      {/* Notifications */}
      {metrics.pendingLeaves > 0 && (
        <div className="grid grid-cols-1 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div
            className="relative group overflow-hidden rounded-2xl p-5 flex items-center justify-between"
            style={{
              background: 'linear-gradient(145deg, rgba(245,158,11,0.15), rgba(10,15,30,0.95))',
              border: '1px solid rgba(245,158,11,0.25)',
              boxShadow: '0 8px 32px rgba(245,158,11,0.1)',
            }}
          >
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <CalendarOff className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-white font-bold tracking-tight text-base">Action Required</h3>
                <p className="text-sm text-amber-400/90 font-medium">
                  You have {metrics.pendingLeaves} pending leave request(s) awaiting approval.
                </p>
              </div>
            </div>
            <a
              href="/manager/leave"
              className="relative z-10 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase px-4 py-2 rounded-xl transition-all border border-amber-500/20"
            >
              Review Now
            </a>
          </div>
        </div>
      )}

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active Shift Card */}
        <div
          className="sm:col-span-2 rounded-3xl p-6 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(10,15,30,0.95))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="relative z-10 flex flex-col h-full justify-between">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Active Outlet Shift</span>
              </div>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Live Status
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-6xl font-extrabold tracking-tighter text-white font-mono">{metrics.presentCount}</span>
              <span className="text-base text-slate-400 font-medium mb-1">/ {metrics.staffCount} Staff Present Today</span>
            </div>
          </div>
        </div>

        {/* Leaves Card */}
        <div className="rounded-3xl p-6 flex flex-col justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors relative overflow-hidden">
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
              <CalendarOff className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Leaves</span>
          </div>
          <div className="relative z-10">
            <p className="text-4xl font-extrabold tracking-tighter text-white font-mono">{metrics.pendingLeaves}</p>
            <p className="text-xs text-slate-400 font-medium mt-1">Pending Requests</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Quick Links */}
        <div className="lg:col-span-4 space-y-4">
          <a
            href="/manager/leave"
            className="group block rounded-3xl p-6 bg-white/[0.02] border border-white/5 hover:border-violet-500/30 transition-all duration-300 relative overflow-hidden shadow-xl"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-violet-300 transition-colors">
                  Review Leave Requests
                </h3>
                <p className="text-xs text-slate-400 mt-1">Approve or reject employee leave</p>
              </div>
              <ArrowRight className="w-5 h-5 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          <a
            href="/manager/attendance"
            className="group block rounded-3xl p-6 bg-white/[0.02] border border-white/5 hover:border-cyan-500/30 transition-all duration-300 relative overflow-hidden shadow-xl"
          >
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                  View Detailed Logs
                </h3>
                <p className="text-xs text-slate-400 mt-1">Inspect daily check-ins & flags</p>
              </div>
              <ArrowRight className="w-5 h-5 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>

        {/* Revamped Live Roster for Outlet */}
        <div className="lg:col-span-8 rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden flex flex-col shadow-2xl">
          <div className="p-6 flex justify-between items-center bg-white/[0.01] border-b border-white/5">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Outlet Workforce Roster ({roster.length} Staff)
            </h2>
          </div>

          {/* Mobile View: Scroll-free responsive cards list (block md:hidden) */}
          <div className="block md:hidden p-4 space-y-3">
            {roster.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No staff entries found for today.
              </div>
            ) : (
              roster.map((emp) => (
                <div
                  key={emp.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3"
                >
                  {/* Top Row: Info & Status */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-cyan-400 border border-cyan-500/20 text-sm shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-bold text-white text-sm truncate">{emp.name}</p>
                          {emp.flagged && (
                            <span title="Flagged Log">
                              <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                          {emp.role.replace('_', ' ')}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {emp.currentStatus === 'WORKING' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          WORKING
                        </span>
                      )}
                      {emp.currentStatus === 'ON_BREAK' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                          <Pause className="w-3 h-3 animate-pulse" />
                          ON BREAK
                        </span>
                      )}
                      {emp.currentStatus === 'SHIFT_ENDED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                          <ShieldCheck className="w-3 h-3" />
                          ENDED
                        </span>
                      )}
                      {emp.currentStatus === 'NOT_STARTED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                          NOT STARTED
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Metrics Grid (2x2) */}
                  <div className="grid grid-cols-2 gap-2 bg-white/[0.02] p-2.5 rounded-xl border border-white/5 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Clock In</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                        <Play className="w-3 h-3" />
                        {emp.clockInTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Clock Out</span>
                      <span className="font-bold text-indigo-300 flex items-center gap-1 mt-0.5">
                        <LogOut className="w-3 h-3" />
                        {emp.clockOutTime}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Hours Worked</span>
                      <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                        <Zap className="w-3 h-3 text-cyan-400" />
                        {emp.hoursWorkedStr}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Break Duration</span>
                      <span className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                        <Coffee className="w-3 h-3" />
                        {emp.breakTimeStr}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop View: Full 6-column table (hidden on mobile, visible on md+) */}
          <div className="hidden md:block flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300 border-collapse">
              <thead className="text-xs uppercase text-slate-500 font-bold bg-white/[0.02] border-b border-white/5">
                <tr>
                  <th className="px-6 py-4">Employee</th>
                  <th className="px-6 py-4">Clock In</th>
                  <th className="px-6 py-4">Clock Out</th>
                  <th className="px-6 py-4">Worked Hours</th>
                  <th className="px-6 py-4">Break Time</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {roster.map((emp) => (
                  <tr key={emp.id} className="hover:bg-white/[0.03] transition-colors group">
                    {/* Name & Role */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-cyan-400 border border-cyan-500/20">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white group-hover:text-cyan-300 transition-colors">
                              {emp.name}
                            </span>
                            {emp.flagged && (
                              <span title="Flagged Log">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">{emp.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </td>

                    {/* Clock In */}
                    <td className="px-6 py-4 font-mono">
                      {emp.clockInTime !== '--:--' ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <Play className="w-3.5 h-3.5" />
                          {emp.clockInTime}
                        </div>
                      ) : (
                        <span className="text-slate-600">--:--</span>
                      )}
                    </td>

                    {/* Clock Out */}
                    <td className="px-6 py-4 font-mono">
                      {emp.clockOutTime === 'In Progress' ? (
                        <span className="text-cyan-400 font-semibold">Active Shift</span>
                      ) : emp.clockOutTime === 'On Break' ? (
                        <span className="text-amber-400 font-semibold">On Break</span>
                      ) : emp.clockOutTime !== '--:--' ? (
                        <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                          <LogOut className="w-3.5 h-3.5" />
                          {emp.clockOutTime}
                        </div>
                      ) : (
                        <span className="text-slate-600">--:--</span>
                      )}
                    </td>

                    {/* Hours Worked */}
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-1.5 text-white font-bold">
                        <Zap className="w-3.5 h-3.5 text-cyan-400" />
                        {emp.hoursWorkedStr}
                      </div>
                    </td>

                    {/* Break Duration */}
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                        <Coffee className="w-3.5 h-3.5" />
                        {emp.breakTimeStr}
                      </div>
                    </td>

                    {/* Status Pill */}
                    <td className="px-6 py-4">
                      {emp.currentStatus === 'WORKING' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          WORKING
                        </span>
                      )}

                      {emp.currentStatus === 'ON_BREAK' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Pause className="w-3.5 h-3.5 animate-pulse" />
                          ON BREAK
                        </span>
                      )}

                      {emp.currentStatus === 'SHIFT_ENDED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          ENDED
                        </span>
                      )}

                      {emp.currentStatus === 'NOT_STARTED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                          NOT STARTED
                        </span>
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
