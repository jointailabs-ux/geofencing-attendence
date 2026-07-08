'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    let message = 'An unexpected error occurred. Please try again.'

    if (error.message.includes('Invalid login credentials')) {
      message = 'Email or password is incorrect.'
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Your account has not been activated yet. Contact your administrator.'
    } else if (error.message.includes('Too many requests')) {
      message = 'Too many login attempts. Please wait a few minutes and try again.'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      message = 'Unable to connect. Check your internet connection.'
    }

    return { error: message }
  }

  // Get employee role for redirect
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Login failed. Please try again.' }

  const { data: employee } = await supabase
    .from('employees')
    .select('role, status')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) {
    await supabase.auth.signOut()
    return { error: 'No employee record found. Contact your administrator.' }
  }

  if (employee.status === 'inactive') {
    await supabase.auth.signOut()
    return { error: 'Your account has been deactivated. Contact your administrator.' }
  }

  const role = employee.role ?? 'staff'

  const roleRoutes: Record<string, string> = {
    super_admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    staff: '/staff/dashboard',
  }

  revalidatePath('/', 'layout')
  redirect(roleRoutes[role] ?? '/staff/dashboard')
}

// ─── Admin Reset Password ─────────────────────────────────────────────────────
export async function adminResetPassword(employeeId: string, newPassword: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Verify caller is super_admin
  const { data: caller } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!caller || caller.role !== 'super_admin') {
    return { error: 'Only administrators can reset passwords.' }
  }

  if (!newPassword || newPassword.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  // Get the target employee's auth_user_id
  const serviceClient = createServiceClient()
  const { data: targetEmployee } = await serviceClient
    .from('employees')
    .select('auth_user_id')
    .eq('id', employeeId)
    .single()

  if (!targetEmployee?.auth_user_id) {
    return { error: 'Employee auth account not found.' }
  }

  // Reset password via admin API
  const { error } = await serviceClient.auth.admin.updateUserById(
    targetEmployee.auth_user_id,
    { password: newPassword }
  )

  if (error) {
    return { error: 'Failed to reset password. Please try again.' }
  }

  return { success: true }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
