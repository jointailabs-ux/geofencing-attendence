import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOutletAttendanceToday } from '@/app/actions/attendance'
import { AttendanceTable } from '@/components/attendance/AttendanceTable'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Attendance' }

export default async function ManagerAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('outlet_id, outlets(name)')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee || !employee.outlet_id) redirect('/login')

  const outlet = employee.outlets as unknown as { name: string }
  const logs = await getOutletAttendanceToday(employee.outlet_id)

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Attendance Dashboard</h1>
        <p className="page-subtitle">Live records for {outlet.name} • {todayStr}</p>
      </div>

      <AttendanceTable logs={logs} outletName={outlet.name} />
    </div>
  )
}
