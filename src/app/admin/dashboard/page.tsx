import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminDashboardStats, getAttendanceTrend } from '@/app/actions/dashboard'
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart'
import { Building2, Users, IndianRupee, CalendarOff, Activity, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('org_id, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const { metrics, outletBreakdown, recentActivity } = await getAdminDashboardStats(employee.org_id)
  const trendData = await getAttendanceTrend(employee.org_id)

  const stats = [
    { label: 'Total Employees', value: metrics.employeeCount, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Total Outlets', value: metrics.outletCount, icon: Building2, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
    { label: "Today's Attendance", value: `${metrics.attendancePercentage}%`, icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Pending Leaves', value: metrics.pendingLeaves, icon: CalendarOff, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Payroll Cost (MTD)', value: `₹${metrics.payrollCost.toLocaleString()}`, icon: IndianRupee, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Welcome back, {employee.full_name}. Here&apos;s your organization overview.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="geo-card !p-4 flex flex-col justify-between h-32 hover:border-[#334155] transition-colors">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
              <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="geo-card">
            <h2 className="text-lg font-bold text-white mb-6">Attendance Trend (30 Days)</h2>
            <AttendanceTrendChart data={trendData} />
          </div>

          <div className="geo-card !p-0 overflow-hidden">
            <div className="p-5 border-b border-[#1E293B] flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Outlet Breakdown</h2>
            </div>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0F172A] text-xs uppercase text-slate-500 font-semibold border-b border-[#1E293B]">
                <tr>
                  <th className="px-5 py-3">Outlet Name</th>
                  <th className="px-5 py-3 text-right">Employees</th>
                  <th className="px-5 py-3 text-right">Today&apos;s Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {outletBreakdown.map(o => (
                  <tr key={o.id} className="hover:bg-[#1E293B]/30">
                    <td className="px-5 py-3 font-medium text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" /> {o.name}
                    </td>
                    <td className="px-5 py-3 text-right">{o.employeeCount}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={`px-2 py-1 rounded-md font-medium text-xs ${o.attendancePercentage >= 80 ? 'bg-valid/10 text-valid' : o.attendancePercentage >= 50 ? 'bg-warn/10 text-warn' : 'bg-danger/10 text-danger'}`}>
                        {o.attendancePercentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="geo-card !p-0 overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-[#1E293B]">
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            </div>
            <div className="divide-y divide-[#1E293B] flex-1 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No recent activity found.</div>
              ) : (
                recentActivity.map((act) => (
                  <div key={act.id} className="p-4 hover:bg-[#1E293B]/30 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-white text-sm">{act.employee_name}</p>
                      <span className="text-xs text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1.5">
                        {act.type === 'Leave Request' ? (
                          <CalendarOff className="w-3.5 h-3.5 text-warn" />
                        ) : (
                          <Activity className="w-3.5 h-3.5 text-accent" />
                        )}
                        <span className="text-xs text-slate-400">{act.type} {act.detail && `• ${act.detail}`}</span>
                      </div>
                      {act.status === 'flagged' && <AlertCircle className="w-4 h-4 text-danger" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
