import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getEmployeeAttendanceHistory } from '@/app/actions/attendance'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { MapPin, Fingerprint } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Attendance' }

export default async function StaffAttendancePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const logs = await getEmployeeAttendanceHistory(employee.id, 50)

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2"
          style={{
            background: 'linear-gradient(135deg, #ffffff, #c4b5fd, #67e8f9)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
          Attendance History
        </h1>
        <p className="text-sm text-slate-400">
          Showing your 50 most recent clock-in and clock-out logs.
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(10, 15, 30, 0.9))',
          border: '1px solid rgba(139, 92, 246, 0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}>
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            <Fingerprint className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No attendance logs found.</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <div key={log.id}
                className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                style={{ borderBottom: i < logs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    {/* Colored dot for check-in vs check-out */}
                    <span className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: log.type === 'check_in'
                          ? 'linear-gradient(135deg, #10B981, #06B6D4)'
                          : 'linear-gradient(135deg, #F59E0B, #F97316)',
                        boxShadow: log.type === 'check_in'
                          ? '0 0 8px rgba(16,185,129,0.4)'
                          : '0 0 8px rgba(245,158,11,0.4)',
                      }} />
                    <span className="font-semibold text-white">
                      {log.type === 'check_in' ? 'Clocked In' : 'Clocked Out'}
                    </span>
                    <span className="text-sm text-slate-400">
                      at{' '}
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    {new Date(log.timestamp).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 px-2.5 py-1 rounded-lg"
                    style={{
                      background: 'rgba(6, 182, 212, 0.06)',
                      border: '1px solid rgba(6, 182, 212, 0.1)',
                    }}>
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    {log.outlet?.name}
                    <span className="opacity-50">({log.distance_from_outlet_meters}m)</span>
                  </div>

                  <StatusBadge 
                    variant={
                      log.status === 'valid' ? 'active' : 
                      log.status === 'flagged' ? 'flagged' : 'manager'
                    } 
                    label={
                      log.status === 'valid' ? 'Valid' :
                      log.status === 'flagged' ? 'Flagged' : 'Overridden'
                    }
                    size="sm" 
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
