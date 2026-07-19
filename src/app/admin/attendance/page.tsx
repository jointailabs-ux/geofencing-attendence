import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDailyAttendanceSummary } from '@/app/actions/attendance'
import { DailySummaryTable } from '@/components/attendance/DailySummaryTable'
import { DatePicker } from '@/components/attendance/DatePicker'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Attendance' }

export default async function AdminAttendancePage({ searchParams }: { searchParams: { date?: string } }) {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  // Use date from searchParams, or default to today in local timezone
  const today = new Date()
  const offset = today.getTimezoneOffset()
  const todayStr = new Date(today.getTime() - (offset*60*1000)).toISOString().split('T')[0]
  
  const selectedDate = searchParams.date || todayStr

  // Fetch summary grouped by employee
  const summaries = await getDailyAttendanceSummary(employee.org_id, selectedDate)

  const dateObj = new Date(selectedDate)
  const displayDateStr = dateObj.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="page-header mb-0">
          <h1 className="page-title text-3xl">Workforce Logs</h1>
          <p className="page-subtitle mt-2 text-base">Tracking hours across all outlets • {displayDateStr}</p>
        </div>
        
        {/* New Calendar Date Selector */}
        <DatePicker />
      </div>

      <DailySummaryTable summaries={summaries} dateStr={selectedDate} isAdmin={true} />
    </div>
  )
}
