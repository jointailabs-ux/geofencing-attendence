import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getManagerDashboardStats } from '@/app/actions/dashboard'
import { Users, CalendarOff, Building2, UserCheck, AlertCircle, Clock, LogOut } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manager Dashboard' }

export default async function ManagerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('outlet_id, full_name, outlets(name)')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee || !employee.outlet_id) redirect('/login')

  const outletName = (employee.outlets as unknown as { name: string })?.name ?? 'Your Outlet'
  const { metrics, roster } = await getManagerDashboardStats(employee.outlet_id)

  const stats = [
    { label: 'Active Staff', value: metrics.staffCount, icon: Users, color: 'text-accent', bg: 'bg-accent/10' },
    { label: 'Present Today', value: metrics.presentCount, icon: UserCheck, color: 'text-valid', bg: 'bg-valid/10' },
    { label: 'Pending Leaves', value: metrics.pendingLeaves, icon: CalendarOff, color: 'text-warn', bg: 'bg-warn/10' },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          <p className="page-subtitle">{outletName}</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        
        {/* Live Roster */}
        <div className="lg:col-span-2">
          <div className="geo-card !p-0 overflow-hidden">
            <div className="p-5 border-b border-[#1E293B] flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Live Roster (Today)</h2>
              <a href="/manager/attendance" className="text-xs text-accent hover:text-accent-hover font-medium">View full logs →</a>
            </div>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-[#0F172A] text-xs uppercase text-slate-500 font-semibold border-b border-[#1E293B]">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Last Log</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E293B]">
                {roster.map(emp => (
                  <tr key={emp.id} className="hover:bg-[#1E293B]/30">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{emp.name}</span>
                        {emp.flagged && <span title="Flagged entries today"><AlertCircle className="w-4 h-4 text-danger" /></span>}
                      </div>
                      <p className="text-xs text-slate-500 uppercase mt-0.5">{emp.role.replace('_', ' ')}</p>
                    </td>
                    <td className="px-5 py-3">
                      {emp.status === 'checked_in' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-valid/10 text-valid">
                          <span className="w-1.5 h-1.5 rounded-full bg-valid animate-pulse"></span> IN
                        </span>
                      ) : emp.status === 'checked_out' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-500/10 text-slate-400">
                          <LogOut className="w-3 h-3" /> OUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#0F172A] text-slate-500 border border-[#1E293B]">
                          Absent
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-400 font-mono text-xs">
                      {emp.lastLogTime ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-50" />
                          {new Date(emp.lastLogTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ) : (
                        <span>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="geo-card !p-5">
            <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider text-slate-500">Quick Actions</h3>
            <div className="space-y-3">
              <a href="/manager/leave" className="flex items-center gap-3 p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-accent/40 transition-colors group cursor-pointer">
                <div className="p-2 bg-warn/10 rounded-lg group-hover:bg-warn/20 transition-colors">
                  <CalendarOff className="w-4 h-4 text-warn" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Review Leaves</p>
                  <p className="text-xs text-slate-400 mt-0.5">Approve/Reject requests</p>
                </div>
              </a>
              <a href="/manager/attendance" className="flex items-center gap-3 p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] hover:border-accent/40 transition-colors group cursor-pointer">
                <div className="p-2 bg-accent/10 rounded-lg group-hover:bg-accent/20 transition-colors">
                  <UserCheck className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">View Full Logs</p>
                  <p className="text-xs text-slate-400 mt-0.5">See today&apos;s check-ins</p>
                </div>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
