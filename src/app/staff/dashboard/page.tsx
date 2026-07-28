import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClockInOutButton } from '@/components/attendance/ClockInOutButton'
import { ShiftTimeTracker } from '@/components/attendance/ShiftTimeTracker'
import { getTodayAttendanceStatus } from '@/app/actions/attendance'
import { getStaffDashboardStats } from '@/app/actions/dashboard'
import { createClient } from '@/lib/supabase/server'
import { 
  Calendar, 
  Wallet, 
  CheckCircle2, 
  MapPin, 
  Sparkles, 
  Bell, 
  User, 
  Award,
  ChevronRight
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Staff Dashboard - GeoAttend' }

export default async function StaffDashboardPage() {
  const employee = await getCachedEmployee()
  if (!employee) redirect('/login')

  const supabase = await createClient()

  const outlet = employee.outlets as unknown as { 
    name: string; 
    latitude: number; 
    longitude: number; 
    radius_meters: number; 
    buffer_meters: number 
  } | null

  // Fetch unread notifications
  const { data: notifications } = await supabase
    .from('notifications')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })
    .limit(2)

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const todayLogs = (await getTodayAttendanceStatus(employee.id)) || []
  
  const stats = await getStaffDashboardStats(employee.id)
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long' })

  // Determine greeting based on IST time
  const currentHour = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false })
  const hourNum = parseInt(currentHour, 10)
  let greeting = 'Welcome back'
  if (hourNum >= 5 && hourNum < 12) greeting = 'Good morning'
  else if (hourNum >= 12 && hourNum < 17) greeting = 'Good afternoon'
  else if (hourNum >= 17 && hourNum < 22) greeting = 'Good evening'

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Premium Ambient Header Card */}
      <div 
        className="relative group overflow-hidden rounded-3xl p-6 border border-white/10 shadow-2xl transition-all duration-300 hover:border-violet-500/20"
        style={{
          background: 'linear-gradient(135deg, rgba(20, 20, 35, 0.7) 0%, rgba(10, 10, 20, 0.9) 100%)',
          backdropFilter: 'blur(24px)',
        }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[70px] pointer-events-none bg-violet-600/10 group-hover:bg-violet-600/15 transition-all duration-500" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-[70px] pointer-events-none bg-cyan-600/10 group-hover:bg-cyan-600/15 transition-all duration-500" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Avatar Ring */}
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
                border: '1px solid rgba(139,92,246,0.25)',
                boxShadow: '0 0 20px rgba(139,92,246,0.15)',
              }}>
              <User className="w-6 h-6 text-violet-400" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1">
                <Sparkles className="w-3 h-3" />
                Geofencing Active
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                {greeting}, <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">{employee.full_name.split(' ')[0]}</span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {today}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge variant={employee.role} size="md" />
            <StatusBadge variant={employee.status} size="md" />
          </div>
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div 
              key={n.id} 
              className="relative overflow-hidden rounded-2xl p-4 border border-violet-500/15 bg-gradient-to-r from-violet-950/20 to-slate-950/40 backdrop-blur-xl flex items-start gap-3 transition-all hover:border-violet-500/25"
            >
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 text-violet-400 flex-shrink-0 mt-0.5">
                <Bell className="w-4 h-4 animate-bounce" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-violet-300 uppercase tracking-wide">{n.title}</h4>
                <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{n.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Clock-In Button & Shift Tracker */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        <div className="md:col-span-5 flex flex-col">
          <ClockInOutButton outlet={outlet} todayLogs={todayLogs} />
        </div>
        
        <div className="md:col-span-7 flex flex-col">
          <ShiftTimeTracker todayLogs={todayLogs} outletName={outlet?.name} />
        </div>
      </div>

      {/* Bento Stats section */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        {/* Attendance - Emerald */}
        <div 
          className="rounded-3xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(10, 15, 30, 0.95) 100%)', 
            border: '1px solid rgba(16,185,129,0.15)' 
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-emerald-500/15 blur-[40px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {monthName}
              </span>
              <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Verified
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono">{stats.attendance.presentDays}</span>
              <span className="text-xs text-slate-400">days present</span>
            </div>
          </div>
        </div>

        {/* Leaves - Amber */}
        <div 
          className="rounded-3xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-lg"
          style={{ 
            background: 'linear-gradient(135deg, rgba(245,158,11,0.06) 0%, rgba(10, 15, 30, 0.95) 100%)', 
            border: '1px solid rgba(245,158,11,0.15)' 
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-amber-500/15 blur-[40px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4" /> Leave Balance
              </span>
              <span className="text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                This Year
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono">{stats.attendance.leavesTakenThisMonth}</span>
              <span className="text-xs text-slate-400">days taken</span>
            </div>
          </div>
        </div>

        {/* Payslips - Violet */}
        <a 
          href="/staff/payslips" 
          className="rounded-3xl p-5 relative overflow-hidden group hover:scale-[1.02] transition-all duration-300 shadow-lg block"
          style={{ 
            background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(10, 15, 30, 0.95) 100%)', 
            border: '1px solid rgba(139,92,246,0.15)' 
          }}
        >
          <div className="absolute -top-8 -right-8 w-28 h-28 bg-violet-500/15 blur-[40px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> Payslip
              </span>
              <ChevronRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              {stats.latestPayslip ? (
                <div>
                  <span className="text-3xl font-black text-white font-mono">
                    ₹{Number(stats.latestPayslip.net_pay).toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Released Payslip</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No payslips released</p>
              )}
            </div>
          </div>
        </a>
      </div>

      {/* Location Details Card */}
      <div 
        className="rounded-3xl p-5 relative overflow-hidden border border-white/5 bg-gradient-to-r from-slate-950/60 to-slate-900/40"
      >
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <MapPin className="w-4 h-4" /> Registered Workplace & Configuration
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Workplace</p>
            <p className="text-sm font-bold text-white mt-1 truncate">{outlet?.name ?? 'Not assigned'}</p>
          </div>
          
          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Geofence Range</p>
            <p className="text-sm font-bold text-white mt-1 font-mono">
              {outlet ? `${outlet.radius_meters}m + ${outlet.buffer_meters}m` : 'N/A'}
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.01] border border-white/5">
            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Break Enforcement</p>
            <p className="text-sm font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <Award className="w-4 h-4 text-emerald-400" /> Automatic (GPS)
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
