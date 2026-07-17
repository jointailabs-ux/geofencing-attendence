import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getManagerDashboardStats } from '@/app/actions/dashboard'
import { Users, CalendarOff, Building2, UserCheck, AlertCircle, Clock, LogOut } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manager Dashboard' }

const statColors = [
  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },   // violet
  { color: '#10B981', bg: 'rgba(16,185,129,0.12)' },    // emerald
  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },    // amber
]

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
    { label: 'Active Staff', value: metrics.staffCount, icon: Users },
    { label: 'Present Today', value: metrics.presentCount, icon: UserCheck },
    { label: 'Pending Leaves', value: metrics.pendingLeaves, icon: CalendarOff },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <div className="flex items-center gap-1.5 mt-1">
          <Building2 className="w-3.5 h-3.5 text-cyan-400" />
          <p className="page-subtitle">{outletName}</p>
        </div>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
        
        {/* Live Roster */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(10, 15, 30, 0.9))',
              border: '1px solid rgba(6, 182, 212, 0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            }}>
            <div className="p-5 flex justify-between items-center"
              style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.1)' }}>
              <h2 className="text-lg font-bold text-white">Live Roster (Today)</h2>
              <a href="/manager/attendance" className="text-xs font-medium transition-colors"
                style={{ color: '#06B6D4' }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.target as HTMLElement).style.color = '#22d3ee'; }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.target as HTMLElement).style.color = '#06B6D4'; }}>
                View full logs →
              </a>
            </div>
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="text-xs uppercase text-slate-500 font-semibold"
                style={{ background: 'rgba(10,15,30,0.5)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Last Log</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((emp, i) => (
                  <tr key={emp.id} className="hover:bg-white/[0.02] transition-colors"
                    style={{ borderBottom: i < roster.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{emp.name}</span>
                        {emp.flagged && <span title="Flagged entries today"><AlertCircle className="w-4 h-4 text-red-400" /></span>}
                      </div>
                      <p className="text-xs text-slate-500 uppercase mt-0.5">{emp.role.replace('_', ' ')}</p>
                    </td>
                    <td className="px-5 py-3">
                      {emp.status === 'checked_in' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(16,185,129,0.12)', color: '#34d399' }}>
                          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#34d399' }}></span> IN
                        </span>
                      ) : emp.status === 'checked_out' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(100,116,139,0.1)', color: '#94a3b8' }}>
                          <LogOut className="w-3 h-3" /> OUT
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                          style={{ background: 'rgba(10,15,30,0.5)', color: '#64748b', border: '1px solid rgba(255,255,255,0.05)' }}>
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
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4" style={{ color: '#a78bfa' }}>Quick Actions</h3>
            <div className="space-y-3">
              <a href="/manager/leave" className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group cursor-pointer"
                style={{
                  background: 'rgba(10,15,30,0.5)',
                  border: '1px solid rgba(245,158,11,0.1)',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.3)'; }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.1)'; }}>
                <div className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(245,158,11,0.12)' }}>
                  <CalendarOff className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Review Leaves</p>
                  <p className="text-xs text-slate-400 mt-0.5">Approve/Reject requests</p>
                </div>
              </a>
              <a href="/manager/attendance" className="flex items-center gap-3 p-3 rounded-xl transition-all duration-300 group cursor-pointer"
                style={{
                  background: 'rgba(10,15,30,0.5)',
                  border: '1px solid rgba(6,182,212,0.1)',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.3)'; }}
                onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(6,182,212,0.1)'; }}>
                <div className="p-2 rounded-lg transition-colors" style={{ background: 'rgba(6,182,212,0.12)' }}>
                  <UserCheck className="w-4 h-4 text-cyan-400" />
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
