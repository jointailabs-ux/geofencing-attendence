import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminDashboardStats } from '@/app/actions/dashboard'
import {
  Building2,
  Users,
  IndianRupee,
  CalendarOff,
  Activity,
  ArrowUpRight,
  Clock,
  Play,
  Pause,
  LogOut,
  ShieldCheck,
  Zap,
  MapPin,
  AlertTriangle,
  Radio,
  Coffee,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard - GeoAttend' }

export default async function AdminDashboardPage() {
  const employee = await getCachedEmployee()
  if (!employee) redirect('/login')

  const { metrics, outletBreakdown, liveRoster, activityFeed } = await getAdminDashboardStats(
    employee.org_id
  )

  const statusCounts = metrics.statusCounts || { working: 0, onBreak: 0, shiftEnded: 0, notStarted: 0 }

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Organization Overview
          </div>
          <h1 className="page-title text-3xl sm:text-4xl font-extrabold text-white">Workforce Dashboard</h1>
          <p className="page-subtitle mt-1 text-slate-400 text-sm">
            Welcome back, <span className="text-white font-bold">{employee.full_name.split(' ')[0]}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/admin/attendance"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
          >
            <Clock className="w-4 h-4 text-cyan-400" /> View All Attendance
          </a>
        </div>
      </div>

      {/* Actionable Notifications */}
      {(metrics.pendingLeaves > 0 || metrics.attendancePercentage < 80) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up">
          {metrics.pendingLeaves > 0 && (
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
                    {metrics.pendingLeaves} pending leave request(s) require your review.
                  </p>
                </div>
              </div>
              <a
                href="/admin/leave"
                className="relative z-10 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-bold tracking-wide uppercase px-4 py-2 rounded-xl transition-all border border-amber-500/20"
              >
                Review
              </a>
            </div>
          )}

          {metrics.attendancePercentage < 80 && (
            <div
              className="relative group overflow-hidden rounded-2xl p-5 flex items-center justify-between"
              style={{
                background: 'linear-gradient(145deg, rgba(239,68,68,0.15), rgba(10,15,30,0.95))',
                border: '1px solid rgba(239,68,68,0.25)',
                boxShadow: '0 8px 32px rgba(239,68,68,0.1)',
              }}
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                  <Activity className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold tracking-tight text-base">Low Attendance Alert</h3>
                  <p className="text-sm text-red-400/90 font-medium">
                    Current workforce presence is at {metrics.attendancePercentage}%.
                  </p>
                </div>
              </div>
              <a
                href="/admin/attendance"
                className="relative z-10 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-bold tracking-wide uppercase px-4 py-2 rounded-xl transition-all border border-red-500/20"
              >
                Inspect
              </a>
            </div>
          )}
        </div>
      )}

      {/* Top Section: Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <div
          className="lg:col-span-2 rounded-3xl p-6 relative overflow-hidden group transition-all duration-500 shadow-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(10,15,30,0.95))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))' }}
              >
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                Today <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Live Attendance Rate</p>
              <div className="flex items-baseline gap-3">
                <span
                  className="text-5xl font-extrabold tracking-tighter"
                  style={{
                    background: 'linear-gradient(135deg, #fff, #a7f3d0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {metrics.attendancePercentage}%
                </span>
                <span className="text-emerald-400 font-bold text-sm">Present Today</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Employees & Outlets */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="rounded-3xl p-5 flex flex-col justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <Users className="w-5 h-5 text-violet-400 mb-4" />
            <div>
              <p className="text-3xl font-extrabold text-white tracking-tight">{metrics.employeeCount}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Total Employees</p>
            </div>
          </div>

          <div className="rounded-3xl p-5 flex flex-col justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <Building2 className="w-5 h-5 text-cyan-400 mb-4" />
            <div>
              <p className="text-3xl font-extrabold text-white tracking-tight">{metrics.outletCount}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Active Outlets</p>
            </div>
          </div>

          <div
            className="rounded-3xl p-5 flex flex-col justify-between transition-colors relative overflow-hidden"
            style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.1)' }}
          >
            <IndianRupee className="w-5 h-5 text-rose-400 mb-4" />
            <div>
              <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                ₹{(metrics.payrollCost / 1000).toFixed(1)}k
              </p>
              <p className="text-xs text-slate-400 font-medium mt-1">Payroll (MTD)</p>
            </div>
          </div>

          <div
            className="rounded-3xl p-5 flex flex-col justify-between transition-colors"
            style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.1)' }}
          >
            <CalendarOff className="w-5 h-5 text-amber-400 mb-4" />
            <div>
              <p className="text-3xl font-extrabold text-white tracking-tight">{metrics.pendingLeaves}</p>
              <p className="text-xs text-amber-400/80 font-medium mt-1">Pending Leaves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Replacement for Graph: Real-time Workforce Status Breakdown & Activity Feed Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 cols: Today's Real-time Workforce Status Card */}
        <div className="lg:col-span-7 rounded-3xl p-6 bg-white/[0.02] border border-white/5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <Zap className="w-5 h-5 text-cyan-400" /> Today&apos;s Workforce Distribution
                </h2>
                <p className="text-xs text-slate-400 mt-1">Real-time status count across all registered outlets</p>
              </div>
            </div>

            {/* 4 Status Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {/* Working Now */}
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Working Now
                </div>
                <p className="text-3xl font-extrabold text-white font-mono">{statusCounts.working}</p>
              </div>

              {/* On Break */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold mb-1">
                  <Coffee className="w-3.5 h-3.5" />
                  On Break
                </div>
                <p className="text-3xl font-extrabold text-white font-mono">{statusCounts.onBreak}</p>
              </div>

              {/* Shift Ended */}
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                <div className="flex items-center justify-center gap-1.5 text-indigo-400 text-xs font-bold mb-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Shift Ended
                </div>
                <p className="text-3xl font-extrabold text-white font-mono">{statusCounts.shiftEnded}</p>
              </div>

              {/* Not Started */}
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-center">
                <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs font-bold mb-1">
                  Not Clocked In
                </div>
                <p className="text-3xl font-extrabold text-white font-mono">{statusCounts.notStarted}</p>
              </div>
            </div>

            {/* Visual Distribution Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-400">
                <span>Shift Progress Breakdown</span>
                <span>{metrics.employeeCount} Total Employees</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
                {metrics.employeeCount > 0 && (
                  <>
                    <div
                      style={{ width: `${(statusCounts.working / metrics.employeeCount) * 100}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title="Working Now"
                    />
                    <div
                      style={{ width: `${(statusCounts.onBreak / metrics.employeeCount) * 100}%` }}
                      className="bg-amber-500 h-full transition-all"
                      title="On Break"
                    />
                    <div
                      style={{ width: `${(statusCounts.shiftEnded / metrics.employeeCount) * 100}%` }}
                      className="bg-indigo-500 h-full transition-all"
                      title="Shift Ended"
                    />
                    <div
                      style={{ width: `${(statusCounts.notStarted / metrics.employeeCount) * 100}%` }}
                      className="bg-slate-700 h-full transition-all"
                      title="Not Started"
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Live Activity Stream Feed */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-white/[0.02] border border-white/5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" /> Live Geofence Activity Stream
              </h2>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Real-Time
              </span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
              {activityFeed.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No attendance events recorded today yet.</p>
              ) : (
                activityFeed.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          item.type === 'check_in'
                            ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]'
                            : 'bg-amber-400'
                        }`}
                      />
                      <div>
                        <p className="font-bold text-white">{item.employeeName}</p>
                        <p className="text-[10px] text-slate-400">
                          {item.label} • <span className="text-slate-500">{item.outletName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-slate-300 font-semibold">
                        {new Date(item.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-slate-500">{item.distanceMeters}m</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* REVAMPED LIVE ROSTER TABLE / CARDS */}
      <div className="rounded-3xl overflow-hidden bg-white/[0.02] border border-white/5 shadow-2xl">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Live Workforce Roster ({liveRoster.length} Employees)
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Detailed tracking of Clock-In time, Clock-Out status, Active Worked Hours, and Break Durations
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              Auto-Refreshed
            </span>
          </div>
        </div>

        {/* Mobile View: Scroll-free responsive cards list (block lg:hidden) */}
        <div className="block lg:hidden p-4 space-y-3">
          {liveRoster.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              No workforce entries found for today.
            </div>
          ) : (
            liveRoster.map((emp) => {
              const colors = [
                'linear-gradient(135deg, #10b981, #06b6d4)',
                'linear-gradient(135deg, #8b5cf6, #ec4899)',
                'linear-gradient(135deg, #f59e0b, #f97316)',
                'linear-gradient(135deg, #3b82f6, #6366f1)',
              ]
              const colorIdx = emp.name.length % colors.length
              const avatarGradient = colors[colorIdx]

              return (
                <div
                  key={emp.id}
                  className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3"
                >
                  {/* Top Row: Employee Info & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0"
                        style={{ background: avatarGradient }}
                      >
                        {emp.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{emp.name}</p>
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

                  {/* Bottom Footer: Outlet & Flags */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {emp.outletName}
                    </span>

                    {emp.hasFlags && (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Flagged
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop View: Full 7-column table (hidden on mobile/tablet, visible on lg+) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300 border-collapse">
            <thead className="text-xs uppercase text-slate-500 font-bold bg-white/[0.02] border-b border-white/5">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Outlet</th>
                <th className="px-6 py-4">Clock In</th>
                <th className="px-6 py-4">Clock Out</th>
                <th className="px-6 py-4">Hours Worked</th>
                <th className="px-6 py-4">Break Time</th>
                <th className="px-6 py-4">Current Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {liveRoster.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No workforce entries found for today.
                  </td>
                </tr>
              ) : (
                liveRoster.map((emp) => {
                  const colors = [
                    'linear-gradient(135deg, #10b981, #06b6d4)',
                    'linear-gradient(135deg, #8b5cf6, #ec4899)',
                    'linear-gradient(135deg, #f59e0b, #f97316)',
                    'linear-gradient(135deg, #3b82f6, #6366f1)',
                  ]
                  const colorIdx = emp.name.length % colors.length
                  const avatarGradient = colors[colorIdx]

                  return (
                    <tr key={emp.id} className="hover:bg-white/[0.03] transition-colors group">
                      {/* Employee Name & Role */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-sm"
                            style={{ background: avatarGradient }}
                          >
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                              {emp.name}
                            </p>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                              {emp.role.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Outlet Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-500" />
                          {emp.outletName}
                        </div>
                      </td>

                      {/* Clock In Time */}
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

                      {/* Clock Out Time / Status */}
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
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-bold text-white text-base">{emp.hoursWorkedStr}</span>
                        </div>
                      </td>

                      {/* Break Duration */}
                      <td className="px-6 py-4 font-mono">
                        <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                          <Coffee className="w-3.5 h-3.5" />
                          {emp.breakTimeStr}
                        </div>
                      </td>

                      {/* Current Status Pill */}
                      <td className="px-6 py-4">
                        {emp.currentStatus === 'WORKING' && (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            WORKING
                          </span>
                        )}

                        {emp.currentStatus === 'ON_BREAK' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                            <Pause className="w-3.5 h-3.5 animate-pulse" />
                            ON BREAK
                          </span>
                        )}

                        {emp.currentStatus === 'SHIFT_ENDED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            SHIFT ENDED
                          </span>
                        )}

                        {emp.currentStatus === 'NOT_STARTED' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                            NOT STARTED
                          </span>
                        )}

                        {emp.hasFlags && (
                          <span
                            className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            title="Flagged out of range"
                          >
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outlet Performance Table Card */}
      <div className="rounded-3xl overflow-hidden bg-white/[0.02] border border-white/5">
        <div
          className="p-6 flex justify-between items-center"
          style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.05), transparent)' }}
        >
          <h2 className="text-lg font-bold text-white">Outlet Attendance Rates</h2>
          <a href="/admin/outlets" className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition-colors">
            View Outlets →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase text-slate-500 font-semibold bg-white/[0.02]">
              <tr>
                <th className="px-6 py-4">Outlet Location</th>
                <th className="px-6 py-4">Workforce</th>
                <th className="px-6 py-4">Today&apos;s Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {outletBreakdown.map((o) => (
                <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                        <Building2 className="w-4 h-4 text-cyan-400" />
                      </div>
                      <span className="font-medium text-white">{o.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">{o.employeeCount}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-full max-w-[120px] h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${o.attendancePercentage}%`,
                            background:
                              o.attendancePercentage >= 80
                                ? '#10B981'
                                : o.attendancePercentage >= 50
                                ? '#F59E0B'
                                : '#EF4444',
                          }}
                        />
                      </div>
                      <span className="font-mono text-xs font-bold text-white">{o.attendancePercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
