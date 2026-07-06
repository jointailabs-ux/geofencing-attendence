import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrgAttendanceToday } from '@/app/actions/attendance'
import { AttendanceTable } from '@/components/attendance/AttendanceTable'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Attendance' }

export default async function AdminAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const logs = await getOrgAttendanceToday(employee.org_id)

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="animate-fade-in space-y-6">
      <div className="page-header">
        <h1 className="page-title">Organization Attendance</h1>
        <p className="page-subtitle">Live records across all outlets • {todayStr}</p>
      </div>

      <AttendanceTable logs={logs} outletName="All Outlets" isAdmin={true} />
    </div>
  )
}
