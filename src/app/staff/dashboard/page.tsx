import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClockInOutButton } from '@/components/attendance/ClockInOutButton'
import { getTodayAttendanceStatus } from '@/app/actions/attendance'
import { getStaffDashboardStats } from '@/app/actions/dashboard'
import { Calendar, Wallet, CheckCircle2, ArrowRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Staff Dashboard' }

export default async function StaffDashboardPage() {
  const employee = await getCachedEmployee()
  if (!employee) redirect('/login')

  const outlet = employee.outlets as unknown as { 
    name: string; 
    latitude: number; 
    longitude: number; 
    radius_meters: number; 
    buffer_meters: number 
  } | null

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayLogs = await getTodayAttendanceStatus(employee.id) || []
  
  const stats = await getStaffDashboardStats(employee.id)
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long' })

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6 animate-fade-in pb-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
          Welcome, {employee.full_name.split(' ')[0]}
        </h1>
        <p className="text-sm font-medium text-slate-400">{today}</p>
      </div>

      <ClockInOutButton outlet={outlet} todayLogs={todayLogs} />

      {/* Bento Grid layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Attendance Summary - Emerald */}
        <div className="col-span-2 sm:col-span-1 rounded-3xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(10,15,30,0.9))', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500/20 blur-[40px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">{monthName} Present</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tighter text-white">{stats.attendance.presentDays}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">days</span>
            </div>
          </div>
        </div>

        {/* Leaves Taken - Amber */}
        <div className="col-span-2 sm:col-span-1 rounded-3xl p-5 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(10,15,30,0.9))', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/20 blur-[40px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex items-center gap-2 text-amber-400">
              <Calendar className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Leave Taken</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tighter text-white">{stats.attendance.leavesTakenThisMonth}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">days</span>
            </div>
          </div>
        </div>

        {/* Latest Payslip - Violet (Full width spanning 2 cols) */}
        <a href="/staff/payslips" className="col-span-2 block rounded-3xl p-5 relative overflow-hidden group hover:border-violet-500/40 transition-all duration-300"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.05), rgba(10,15,30,0.9))', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-violet-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-violet-500/20 transition-colors" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-violet-400 mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Latest Payslip</span>
              </div>
              {stats.latestPayslip ? (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tighter text-white font-mono">
                    ₹{Number(stats.latestPayslip.net_pay).toFixed(0)}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    for {new Date(stats.latestPayslip.year, stats.latestPayslip.month - 1).toLocaleDateString('en-IN', { month: 'short' })}
                  </span>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic mt-2">No payslips generated yet</p>
              )}
            </div>
            <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </a>

        {/* Your Details - Info Card */}
        <div className="col-span-2 rounded-3xl p-5"
          style={{ background: 'rgba(6,182,212,0.03)', border: '1px solid rgba(6,182,212,0.1)' }}>
          <h3 className="text-xs font-bold text-cyan-400 mb-4 uppercase tracking-wider">Your Assignment</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/5">
              <span className="text-sm font-medium text-slate-400">Primary Outlet</span>
              <span className="text-sm font-bold text-white">{outlet?.name ?? 'Not assigned'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-slate-400">Account Status</span>
              <div className="flex gap-2">
                <StatusBadge variant={employee.role} size="sm" />
                <StatusBadge variant={employee.status} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
