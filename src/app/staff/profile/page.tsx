import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { getEmployeeAttendanceHistory } from '@/app/actions/attendance'
import { User, Mail, Phone, MapPin, Calendar, Briefcase, Hash, Clock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

export default async function StaffProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('*, outlets(name)')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const outletName = (employee.outlets as unknown as { name: string } | null)?.name ?? null
  const recentLogs = await getEmployeeAttendanceHistory(employee.id, 10)

  const detailItems = [
    { icon: Mail, color: '#8B5CF6', label: 'Email', value: employee.email },
    employee.phone ? { icon: Phone, color: '#06B6D4', label: 'Phone', value: employee.phone } : null,
    employee.employee_code ? { icon: Hash, color: '#F59E0B', label: 'Employee ID', value: employee.employee_code, mono: true } : null,
    { icon: MapPin, color: '#10B981', label: 'Outlet', value: outletName ?? 'Not assigned' },
    {
      icon: Calendar,
      color: '#F43F5E',
      label: 'Joined',
      value: new Date(employee.join_date).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    },
    {
      icon: Briefcase,
      color: '#8B5CF6',
      label: 'Salary',
      value: `₹${employee.base_salary.toLocaleString('en-IN')}`,
      badge: employee.salary_type
    },
  ].filter(Boolean) as { icon: typeof Mail; color: string; label: string; value: string; mono?: boolean; badge?: string }[]

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="geo-card text-center relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[50px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.15), transparent)' }} />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full blur-[50px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.1), transparent)' }} />

        <div className="relative z-10">
          {/* Gradient avatar ring */}
          <div className="w-18 h-18 mx-auto mb-4 relative">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto"
              style={{
                background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
                boxShadow: '0 0 0 2px rgba(139,92,246,0.3), 0 0 20px rgba(139,92,246,0.15)',
              }}>
              <User className="w-8 h-8 text-violet-400" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-white">{employee.full_name}</h1>
          {employee.employee_code && (
            <p className="font-mono text-sm font-semibold mt-1"
              style={{ color: '#a78bfa' }}>{employee.employee_code}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-3">
            <StatusBadge variant={employee.role} size="sm" />
            <StatusBadge variant={employee.status} size="sm" />
          </div>
        </div>
      </div>

      {/* Details Card */}
      <div className="geo-card">
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: '#a78bfa' }}>Account Details</h2>
        <div className="space-y-3">
          {detailItems.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: `${item.color}15` }}>
                <item.icon className="w-4 h-4" style={{ color: item.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500">{item.label}</p>
                <div className="flex items-center gap-2">
                  <p className={`text-sm text-slate-300 truncate ${item.mono ? 'font-mono font-semibold' : ''}`}>{item.value}</p>
                  {item.badge && <StatusBadge variant={item.badge as 'fixed' | 'daily' | 'hourly'} size="sm" showDot={false} />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(10, 15, 30, 0.9))',
          border: '1px solid rgba(6, 182, 212, 0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
        <div className="p-4 flex items-center gap-2"
          style={{ borderBottom: '1px solid rgba(6, 182, 212, 0.1)' }}>
          <div className="p-1.5 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.12)' }}>
            <Clock className="w-4 h-4 text-cyan-400" />
          </div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Attendance</h3>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No attendance records yet</div>
        ) : (
          <div>
            {recentLogs.map((log, i) => (
              <div key={log.id} className="p-3 px-4 flex justify-between items-center"
                style={{
                  background: 'rgba(10, 15, 30, 0.5)',
                  borderBottom: i < recentLogs.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full"
                    style={{
                      background: log.type === 'check_in'
                        ? 'linear-gradient(135deg, #10B981, #06B6D4)'
                        : 'linear-gradient(135deg, #F59E0B, #F97316)',
                      boxShadow: log.type === 'check_in'
                        ? '0 0 6px rgba(16,185,129,0.4)'
                        : '0 0 6px rgba(245,158,11,0.4)',
                    }} />
                  <span className="text-sm text-slate-300 capitalize">
                    {log.type === 'check_in' ? 'Check In' : 'Check Out'}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">
                    {new Date(log.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-600 text-center">
        To update your password or details, contact your administrator.
      </p>
    </div>
  )
}
