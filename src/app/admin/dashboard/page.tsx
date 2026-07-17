import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getAdminDashboardStats, getAttendanceTrend } from '@/app/actions/dashboard'
import { AttendanceTrendChart } from '@/components/dashboard/AttendanceTrendChart'
import { Building2, Users, IndianRupee, CalendarOff, Activity, ArrowUpRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin Dashboard' }

export default async function AdminDashboardPage() {
  const employee = await getCachedEmployee()
  if (!employee) redirect('/login')

  const { metrics, outletBreakdown, recentActivity } = await getAdminDashboardStats(employee.org_id)
  const trendData = await getAttendanceTrend(employee.org_id)

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="page-title text-3xl">Overview</h1>
          <p className="page-subtitle mt-2 text-base">Welcome back, <span className="text-white font-medium">{employee.full_name.split(' ')[0]}</span></p>
        </div>
      </div>

      {/* Bento Grid Top Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Main large stat - Today's Attendance */}
        <div className="lg:col-span-2 rounded-3xl p-6 relative overflow-hidden group transition-all duration-500 hover:shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(10,15,30,0.95))',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
          {/* Decorative mesh */}
          <div className="absolute -top-32 -right-32 w-64 h-64 rounded-full blur-[80px] opacity-30 group-hover:opacity-50 transition-opacity duration-500"
            style={{ background: '#10B981' }} />
            
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.1))' }}>
                <Activity className="w-6 h-6 text-emerald-400" />
              </div>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400">
                Today <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>
            
            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Live Attendance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-bold tracking-tighter"
                  style={{
                    background: 'linear-gradient(135deg, #fff, #a7f3d0)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                  {metrics.attendancePercentage}%
                </span>
                <span className="text-emerald-400 font-medium">Present</span>
              </div>
            </div>
          </div>
        </div>

        {/* Small stats in a 2x2 grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <div className="rounded-3xl p-5 flex flex-col justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <Users className="w-5 h-5 text-violet-400 mb-4" />
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{metrics.employeeCount}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Total Employees</p>
            </div>
          </div>
          
          <div className="rounded-3xl p-5 flex flex-col justify-between bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-colors">
            <Building2 className="w-5 h-5 text-cyan-400 mb-4" />
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{metrics.outletCount}</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Active Outlets</p>
            </div>
          </div>
          
          <div className="rounded-3xl p-5 flex flex-col justify-between transition-colors relative overflow-hidden"
            style={{ background: 'rgba(244,63,94,0.03)', border: '1px solid rgba(244,63,94,0.1)' }}>
            <IndianRupee className="w-5 h-5 text-rose-400 mb-4" />
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">₹{(metrics.payrollCost / 1000).toFixed(1)}k</p>
              <p className="text-xs text-slate-400 font-medium mt-1">Payroll (MTD)</p>
            </div>
          </div>
          
          <div className="rounded-3xl p-5 flex flex-col justify-between transition-colors"
            style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.1)' }}>
            <CalendarOff className="w-5 h-5 text-amber-400 mb-4" />
            <div>
              <p className="text-3xl font-bold text-white tracking-tight">{metrics.pendingLeaves}</p>
              <p className="text-xs text-amber-400/80 font-medium mt-1">Pending Leaves</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Grid Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Trend Chart */}
        <div className="lg:col-span-2 rounded-3xl p-6 bg-white/[0.02] border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Attendance Trend</h2>
            <select className="bg-transparent border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-violet-500">
              <option>Last 30 Days</option>
              <option>This Week</option>
            </select>
          </div>
          <div className="h-[250px] w-full">
            <AttendanceTrendChart data={trendData} />
          </div>
        </div>

        {/* Activity Feed */}
        <div className="rounded-3xl p-6 bg-white/[0.02] border border-white/5 flex flex-col">
          <h2 className="text-lg font-bold text-white mb-6">Activity Feed</h2>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 -mr-2">
            {recentActivity.length === 0 ? (
              <div className="text-center text-slate-500 text-sm py-8">No recent activity.</div>
            ) : (
              recentActivity.map((act) => (
                <div key={act.id} className="group relative pl-4 border-l-2 border-white/10 hover:border-violet-500/50 transition-colors py-1">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-slate-800 border-2 border-slate-600 group-hover:border-violet-500 group-hover:bg-violet-400 transition-colors" />
                  <p className="text-sm font-semibold text-slate-200">{act.employee_name}</p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    {act.type === 'Leave Request' ? <CalendarOff className="w-3 h-3 text-amber-400" /> : <Activity className="w-3 h-3 text-emerald-400" />}
                    {act.type} {act.detail && `— ${act.detail}`}
                  </p>
                  <p className="text-[10px] text-slate-600 font-mono mt-1">
                    {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Outlets Table Card */}
      <div className="rounded-3xl overflow-hidden bg-white/[0.02] border border-white/5">
        <div className="p-6 flex justify-between items-center"
          style={{ background: 'linear-gradient(90deg, rgba(6,182,212,0.05), transparent)' }}>
          <h2 className="text-lg font-bold text-white">Outlet Performance</h2>
          <a href="/admin/outlets" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">View All →</a>
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
                      <div className="w-full max-w-[100px] h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full"
                          style={{
                            width: `${o.attendancePercentage}%`,
                            background: o.attendancePercentage >= 80 ? '#10B981' : o.attendancePercentage >= 50 ? '#F59E0B' : '#EF4444'
                          }} />
                      </div>
                      <span className="font-mono text-xs">{o.attendancePercentage}%</span>
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
