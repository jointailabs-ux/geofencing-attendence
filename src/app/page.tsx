import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

// Root page — redirect to appropriate dashboard based on auth state
export default async function RootPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  const roleRoutes: Record<string, string> = {
    super_admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    staff: '/staff/dashboard',
  }

  redirect(roleRoutes[employee?.role ?? 'staff'] ?? '/staff/dashboard')
}
