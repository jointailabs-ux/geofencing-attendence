import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLeaveBalances, getMyLeaveRequests } from '@/app/actions/leave'
import { LeaveBalanceCards } from '@/components/leave/LeaveBalanceCards'
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm'
import { MyLeaveRequests } from '@/components/leave/MyLeaveRequests'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Leave Management' }

export default async function StaffLeavePage() {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('id, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const currentYear = new Date().getFullYear()
  
  // Parallel fetch balances and history
  const [balances, requests] = await Promise.all([
    getLeaveBalances(employee.id, currentYear),
    getMyLeaveRequests(employee.id)
  ])

  return (
    <div className="animate-fade-in space-y-8 p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Leave Management</h1>
        <p className="page-subtitle">Track balances and request time off</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">My Balances ({currentYear})</h2>
        <LeaveBalanceCards balances={balances} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <LeaveRequestForm employeeId={employee.id} balances={balances} />
        </div>
        
        <div className="lg:col-span-2">
          <MyLeaveRequests requests={requests} employeeId={employee.id} />
        </div>
      </div>
    </div>
  )
}
