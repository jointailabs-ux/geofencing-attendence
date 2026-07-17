import { createClient } from '@/lib/supabase/server'
import { getCachedUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getHolidays } from '@/app/actions/settings'
import { HolidaysManager } from '@/components/settings/HolidaysManager'
import { UserManagement } from '@/components/settings/UserManagement'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const user = await getCachedUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  const holidays = await getHolidays(employee.org_id)

  const { data: mgmtUsers } = await supabase
    .from('employees')
    .select('id, full_name, role, status, outlets(name)')
    .eq('org_id', employee.org_id)
    .in('role', ['super_admin', 'manager'])
    .order('created_at', { ascending: false })

  return (
    <div className="animate-fade-in space-y-8">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Organization and application settings</p>
      </div>
      
      
      <UserManagement users={mgmtUsers || []} />
      <HolidaysManager orgId={employee.org_id} initialHolidays={holidays} />
    </div>
  )
}
