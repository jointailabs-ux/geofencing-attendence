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

  return (
    <div className="p-4 sm:p-8 max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="geo-card text-center">
        <div className="w-16 h-16 bg-accent/10 border-2 border-accent/30 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-accent" />
        </div>
        <h1 className="text-xl font-bold text-white">{employee.full_name}</h1>
        {employee.employee_code && (
          <p className="font-mono text-sm text-accent font-semibold mt-1">{employee.employee_code}</p>
        )}
        <div className="flex items-center justify-center gap-2 mt-3">
          <StatusBadge variant={employee.role} size="sm" />
          <StatusBadge variant={employee.status} size="sm" />
        </div>
      </div>

      {/* Details Card */}
      <div className="geo-card">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Account Details</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500">Email</p>
              <p className="text-sm text-slate-300 truncate">{employee.email}</p>
            </div>
          </div>

          {employee.phone && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm text-slate-300">{employee.phone}</p>
              </div>
            </div>
          )}

          {employee.employee_code && (
            <div className="flex items-center gap-3">
              <Hash className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-slate-500">Employee ID</p>
                <p className="text-sm text-slate-300 font-mono font-semibold">{employee.employee_code}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-500">Outlet</p>
              <p className="text-sm text-slate-300">{outletName ?? 'Not assigned'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-500">Joined</p>
              <p className="text-sm text-slate-300">
                {new Date(employee.join_date).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Briefcase className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-slate-500">Salary</p>
              <div className="flex items-center gap-2">
                <p className="text-sm text-slate-300">₹{employee.base_salary.toLocaleString('en-IN')}</p>
                <StatusBadge variant={employee.salary_type} size="sm" showDot={false} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Attendance */}
      <div className="geo-card !p-0 overflow-hidden">
        <div className="p-4 border-b border-[#1E293B] bg-[#0F172A] flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Attendance</h3>
        </div>
        {recentLogs.length === 0 ? (
          <div className="p-6 text-center text-sm text-slate-500">No attendance records yet</div>
        ) : (
          <div className="divide-y divide-[#1E293B]">
            {recentLogs.map((log) => (
              <div key={log.id} className="p-3 px-4 flex justify-between items-center bg-[#0F172A]/50">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${log.type === 'check_in' ? 'bg-emerald-400' : 'bg-orange-400'}`} />
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
