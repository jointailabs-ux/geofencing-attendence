import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminDashboardStats, getAttendanceTrend } from '@/app/actions/dashboard'
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart'
import { Building2, Users, IndianRupee, CalendarOff, Activity, AlertCircle } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

const statColors = [
  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },   // violet - Employees
  { color: '#06B6D4', bg: 'rgba(6,182,212,0.12)' },     // teal - Outlets
  { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },    // emerald - Attendance
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },    // amber - Leaves
  { color: '#F43F5E', bg: 'rgba(244,63,94,0.12)' },     // rose - Payroll
]

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
    { label: 'Total Employees', value: metrics.employeeCount, icon: Users },
    { label: 'Total Outlets', value: metrics.outletCount, icon: Building2 },
    { label: "Today's Attendance", value: `${metrics.attendancePercentage}%`, icon: Activity },
    { label: 'Pending Leaves', value: metrics.pendingLeaves, icon: CalendarOff },
    { label: 'Payroll Cost (MTD)', value: `₹${metrics.payrollCost.toLocaleString()}`, icon: IndianRupee },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Welcome back, {employee.full_name}. Here&apos;s your organization overview.</p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon }, idx) => {
          const { color, bg } = statColors[idx]
          return (
            <div key={label} className="rounded-2xl p-4 flex flex-col justify-between h-32 transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(145deg, ${bg}, rgba(10,15,30,0.9))`,
                border: `1px solid ${color}20`,
                boxShadow: `0 8px 32px rgba(0,0,0,0.2), 0 0 20px ${color}08`,
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: bg }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                <p className="text-xs font-medium text-slate-400 mt-0.5">{label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="geo-card">
            <h2 className="text-lg font-bold text-white mb-6">Attendance Trend (30 Days)</h2>
            <AttendanceTrendChart data={trendData} />
          </div>

          <div className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(10, 15, 30, 0.9))',
              border: '1px solid rgba(6, 182, 212, 0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
            <div className="p-5 flex justify-between items-center"
              style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.1)' }}>
              <h2 className="text-lg font-bold text-white">Outlet Breakdown</h2>
            </div>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500 font-semibold"
                style={{ background: 'rgba(10,15,30,0.5)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <tr>
                  <th className="px-5 py-3">Outlet Name</th>
                  <th className="px-5 py-3 text-right">Employees</th>
                  <th className="px-5 py-3 text-right">Today&apos;s Attendance</th>
                </tr>
              </thead>
              <tbody>
                {outletBreakdown.map((o, i) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < outletBreakdown.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td className="px-5 py-3 font-medium text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" /> {o.name}
                    </td>
                    <td className="px-5 py-3 text-right">{o.employeeCount}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="px-2 py-1 rounded-lg font-medium text-xs"
                        style={{
                          background: o.attendancePercentage >= 80
                            ? 'rgba(16,185,129,0.12)' : o.attendancePercentage >= 50
                            ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)',
                          color: o.attendancePercentage >= 80
                            ? '#34d399' : o.attendancePercentage >= 50
                            ? '#fbbf24' : '#f87171',
                        }}>
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
          <div className="rounded-2xl overflow-hidden h-full flex flex-col"
            style={{
              background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(10, 15, 30, 0.9))',
              border: '1px solid rgba(139, 92, 246, 0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
            <div className="p-5" style={{ borderBottom: '1px solid rgba(139,92,246,0.1)' }}>
              <h2 className="text-lg font-bold text-white">Recent Activity</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No recent activity found.</div>
              ) : (
                recentActivity.map((act, i) => (
                  <div key={act.id} className="p-4 hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < recentActivity.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-semibold text-white text-sm">{act.employee_name}</p>
                      <span className="text-xs text-slate-500">
                        {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center gap-1.5">
                        {act.type === 'Leave Request' ? (
                          <CalendarOff className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Activity className="w-3.5 h-3.5 text-violet-400" />
                        )}
                        <span className="text-xs text-slate-400">{act.type} {act.detail && `• ${act.detail}`}</span>
                      </div>
                      {act.status === 'flagged' && <AlertCircle className="w-4 h-4 text-red-400" />}
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
