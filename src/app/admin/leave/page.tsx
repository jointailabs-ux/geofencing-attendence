import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPendingLeaveRequests, getTeamLeaveCalendar } from '@/app/actions/leave'
import { LeaveApprovalsInbox } from '@/components/leave/LeaveApprovalsInbox'
import { TeamLeaveCalendar } from '@/components/leave/TeamLeaveCalendar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Org Leave Calendar' }

export default async function AdminLeavePage({ searchParams }: { searchParams: { month?: string, year?: string } }) {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const today = new Date()
  const month = searchParams.month ? parseInt(searchParams.month) : today.getMonth() + 1
  const year = searchParams.year ? parseInt(searchParams.year) : today.getFullYear()

  // Fetch all pending requests and approved calendar for the entire ORG
  const [pendingRequests, approvedLeaves] = await Promise.all([
    getPendingLeaveRequests(employee.org_id, null),
    getTeamLeaveCalendar(employee.org_id, month, year, null)
  ])

  return (
    <div className="animate-fade-in space-y-8">
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Organization Leave</h1>
          <p className="page-subtitle">Manage time off across all outlets</p>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Pending Org Requests ({pendingRequests.length})</h2>
        <LeaveApprovalsInbox requests={pendingRequests} currentUserId={employee.id} />
      </div>

      <div className="pt-8">
        <TeamLeaveCalendar approvedLeaves={approvedLeaves} />
      </div>
    </div>
  )
}
