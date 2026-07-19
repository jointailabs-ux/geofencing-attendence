import { getCachedEmployee } from '@/lib/auth'
import { ManagerSidebar } from './ManagerSidebar'
import { redirect } from 'next/navigation'

export async function ManagerSidebarWrapper() {
  const employee = await getCachedEmployee()
  
  if (!employee || employee.role !== 'manager') {
    redirect('/login')
  }

  return (
    <ManagerSidebar
      userName={employee.full_name}
      userRole={employee.role}
      outletName={employee.outlets?.name}
    />
  )
}
