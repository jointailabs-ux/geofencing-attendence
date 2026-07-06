import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClockInOutButton } from '@/components/attendance/ClockInOutButton'
import { getTodayAttendanceStatus } from '@/app/actions/attendance'
import { getStaffDashboardStats } from '@/app/actions/dashboard'
import { Calendar, Wallet, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Staff Dashboard' }

export default async function StaffDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*, outlets(name, latitude, longitude, radius_meters, buffer_meters)')
    .eq('auth_user_id', user.id)
    .single()

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
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-bold text-white mb-1">Welcome, {employee.full_name.split(' ')[0]}</h1>
        <p className="text-slate-400">{today}</p>
      </div>

      <ClockInOutButton outlet={outlet} todayLogs={todayLogs} />

      <div className="grid grid-cols-2 gap-4">
        {/* Attendance Summary */}
        <div className="geo-card !p-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <CheckCircle2 className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">{monthName} Attendance</h3>
          </div>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{stats.attendance.presentDays}</p>
              <p className="text-xs text-slate-500 mt-0.5">Days Present</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-slate-300">{stats.attendance.leavesTakenThisMonth}</p>
              <p className="text-xs text-slate-500 mt-0.5">Leave Days</p>
            </div>
          </div>
        </div>

        {/* Latest Payslip */}
        <div className="geo-card !p-4 bg-gradient-to-br from-[#0F172A] to-[#1E293B]">
          <div className="flex items-center gap-2 mb-4 text-slate-400">
            <Wallet className="w-4 h-4" />
            <h3 className="text-xs font-semibold uppercase tracking-wider">Latest Payslip</h3>
          </div>
          {stats.latestPayslip ? (
            <div>
              <p className="text-2xl font-bold text-white tracking-tight font-mono">₹{Number(stats.latestPayslip.net_pay).toFixed(2)}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {new Date(stats.latestPayslip.year, stats.latestPayslip.month - 1).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          ) : (
            <div className="mt-2 text-sm text-slate-500 italic">No payslips yet</div>
          )}
        </div>
      </div>

      <div className="geo-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] bg-[#0F172A] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Available Leave Balances</h3>
        </div>
        <div className="divide-y divide-[#1E293B]">
          {stats.balances.map((b, i) => (
            <div key={i} className="p-4 flex justify-between items-center bg-[#0F172A]/50">
              <span className="text-slate-300 text-sm font-medium">{b.name}</span>
              <span className="text-white font-bold">{b.available} Days</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="geo-card !p-4">
        <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Your Details</h3>
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Outlet</span>
            <span className="text-slate-300 font-medium">{outlet?.name ?? 'Not assigned'}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500">Status</span>
            <div className="flex gap-2">
              <StatusBadge variant={employee.role} size="sm" />
              <StatusBadge variant={employee.status} size="sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
