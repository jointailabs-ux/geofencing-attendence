import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPendingLeaveRequests, getTeamLeaveCalendar } from '@/app/actions/leave'
import { LeaveApprovalsInbox } from '@/components/leave/LeaveApprovalsInbox'
import { TeamLeaveCalendar } from '@/components/leave/TeamLeaveCalendar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leave Approvals' }

export default async function ManagerLeavePage({ searchParams }: { searchParams: { month?: string, year?: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, org_id, outlet_id, outlets(name)')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee || !employee.outlet_id) redirect('/login')
  const outlet = employee.outlets as unknown as { name: string }

  const today = new Date()
  const month = searchParams.month ? parseInt(searchParams.month) : today.getMonth() + 1
  const year = searchParams.year ? parseInt(searchParams.year) : today.getFullYear()

  // Fetch pending requests and approved calendar for this outlet
  const [pendingRequests, approvedLeaves] = await Promise.all([
    getPendingLeaveRequests(employee.org_id, employee.outlet_id),
    getTeamLeaveCalendar(employee.org_id, month, year, employee.outlet_id)
  ])

  return (
    <div className="animate-fade-in space-y-8">
      <div className="page-header">
        <h1 className="page-title">Leave Approvals</h1>
        <p className="page-subtitle">Manage time off for {outlet.name}</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">Pending Requests ({pendingRequests.length})</h2>
        <LeaveApprovalsInbox requests={pendingRequests} currentUserId={employee.id} />
      </div>

      <div className="pt-8">
        <TeamLeaveCalendar approvedLeaves={approvedLeaves} />
      </div>
    </div>
  )
}
