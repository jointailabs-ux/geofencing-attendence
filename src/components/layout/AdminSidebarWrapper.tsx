import { getCachedEmployee } from '@/lib/auth'
import { AdminSidebar } from './AdminSidebar'
import { redirect } from 'next/navigation'

export async function AdminSidebarWrapper() {
  const employee = await getCachedEmployee()
  
  // Security fallback in case middleware is bypassed
  if (!employee || employee.role !== 'super_admin') {
    redirect('/login')
  }

  return (
    <AdminSidebar
      userName={employee.full_name}
      userRole={employee.role}
      outletName={employee.outlets?.name}
    />
  )
}
