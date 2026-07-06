import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Employee' }

export default async function NewEmployeePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: caller } = await supabase
    .from('employees')
    .select('org_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!caller) redirect('/login')

  const { data: outlets } = await supabase
    .from('outlets')
    .select('id, name')
    .eq('org_id', caller.org_id)
    .order('name')

  return (
    <EmployeeForm
      outlets={outlets ?? []}
      callerRole={caller.role}
    />
  )
}
