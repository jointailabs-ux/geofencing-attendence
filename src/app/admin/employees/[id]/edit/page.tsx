import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { EmployeeForm } from '@/components/employees/EmployeeForm'
import type { Employee } from '@/lib/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Employee' }

interface EditEmployeePageProps {
  params: { id: string }
}

export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
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

  const [{ data: employee }, { data: outlets }] = await Promise.all([
    supabase
      .from('employees')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', caller.org_id)
      .single(),
    supabase
      .from('outlets')
      .select('id, name')
      .eq('org_id', caller.org_id)
      .order('name'),
  ])

  if (!employee) notFound()

  return (
    <EmployeeForm
      employee={employee as unknown as Employee}
      outlets={outlets ?? []}
      callerRole={caller.role}
    />
  )
}
