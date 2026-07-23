import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClockInOutButton } from '@/components/attendance/ClockInOutButton'
import { ShiftTimeTracker } from '@/components/attendance/ShiftTimeTracker'
import { getTodayAttendanceStatus } from '@/app/actions/attendance'
import { getStaffDashboardStats } from '@/app/actions/dashboard'
import { Calendar, Wallet, CheckCircle2, ArrowRight, MapPin, Sparkles } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Staff Dashboard - GeoAttend' }

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
  const todayLogs = (await getTodayAttendanceStatus(employee.id)) || []
  
  const stats = await getStaffDashboardStats(employee.id)
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long' })

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Automated Geofence Active
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Welcome back, <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">{employee.full_name.split(' ')[0]}</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 mt-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-500" />
            {today}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge variant={employee.role} size="md" />
          <StatusBadge variant={employee.status} size="md" />
        </div>
      </div>

      {/* Main Grid: Left = Clock Button Hero, Right = Shift Time Tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col justify-center">
          <ClockInOutButton outlet={outlet} todayLogs={todayLogs} />
        </div>
        
        <div className="lg:col-span-7 flex flex-col justify-center">
          <ShiftTimeTracker todayLogs={todayLogs} outletName={outlet?.name} />
        </div>
      </div>

      {/* Bento Grid Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Attendance Summary - Emerald */}
        <div className="rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(10,15,30,0.95))', border: '1px solid rgba(16,185,129,0.15)' }}>
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/30 transition-colors" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">{monthName} Attendance</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400/80 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                Verified
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-extrabold tracking-tighter text-white font-mono">{stats.attendance.presentDays}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">days present</span>
            </div>
          </div>
        </div>

        {/* Leaves Taken - Amber */}
        <div className="rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl"
          style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(10,15,30,0.95))', border: '1px solid rgba(245,158,11,0.15)' }}>
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-amber-500/20 blur-[50px] rounded-full pointer-events-none group-hover:bg-amber-500/30 transition-colors" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <Calendar className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Leave Taken</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-400/80 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                This Month
              </span>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-extrabold tracking-tighter text-white font-mono">{stats.attendance.leavesTakenThisMonth}</span>
              <span className="text-sm font-medium text-slate-400 mb-1">days taken</span>
            </div>
          </div>
        </div>

        {/* Latest Payslip - Violet */}
        <a href="/staff/payslips" className="rounded-3xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl block"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(10,15,30,0.95))', border: '1px solid rgba(139,92,246,0.15)' }}>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-violet-500/15 blur-[50px] rounded-full pointer-events-none group-hover:bg-violet-500/25 transition-colors" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-violet-400">
                <Wallet className="w-5 h-5" />
                <span className="text-xs font-bold uppercase tracking-wider">Latest Payslip</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center text-violet-400 group-hover:bg-violet-500 group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {stats.latestPayslip ? (
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold tracking-tighter text-white font-mono">
                    ₹{Number(stats.latestPayslip.net_pay).toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Issued for {new Date(stats.latestPayslip.year, stats.latestPayslip.month - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No payslips issued yet</p>
            )}
          </div>
        </a>
      </div>

      {/* Outlet & Assignment Info Card */}
      <div className="rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, rgba(6,182,212,0.04), rgba(10,15,30,0.95))', border: '1px solid rgba(6,182,212,0.12)' }}>
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Your Assigned Location & Details
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-slate-400 font-medium">Assigned Outlet</p>
            <p className="text-base font-bold text-white mt-1">{outlet?.name ?? 'Not assigned'}</p>
          </div>
          
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-slate-400 font-medium">Geofence Radius</p>
            <p className="text-base font-bold text-white mt-1 font-mono">
              {outlet ? `${outlet.radius_meters}m (+${outlet.buffer_meters}m buffer)` : 'N/A'}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
            <p className="text-xs text-slate-400 font-medium">Automated Break Policy</p>
            <p className="text-base font-bold text-emerald-400 mt-1">Enabled (GPS Range)</p>
          </div>
        </div>
      </div>
    </div>
  )
}
