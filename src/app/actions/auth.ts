'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/server'

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const pin = formData.get('pin') as string

  if (!pin) {
    return { error: 'PIN is required.' }
  }

  // 1. Look up the employee by PIN using the service client
  const { data: employee } = await serviceClient
    .from('employees')
    .select('email, role, status')
    .eq('pin', pin)
    .single()

  if (!employee) {
    return { error: 'Invalid PIN.' }
  }

  if (employee.status === 'inactive') {
    return { error: 'Your account has been deactivated. Contact your administrator.' }
  }

  // 2. Authenticate with Supabase Auth using the email and PIN as password
  const { error } = await supabase.auth.signInWithPassword({ email: employee.email, password: pin })

  if (error) {
    let message = 'An unexpected error occurred. Please try again.'
    if (error.message.includes('Invalid login credentials')) {
      message = 'Invalid PIN.'
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Your account has not been activated yet. Contact your administrator.'
    } else if (error.message.includes('Too many requests')) {
      message = 'Too many login attempts. Please wait a few minutes and try again.'
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      message = 'Unable to connect. Check your internet connection.'
    }
    return { error: message }
  }

  const role = employee.role ?? 'staff'

  // 3. Set the role cookie so middleware doesn't need to query the database
  cookies().set('user_role', role, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 // 1 week
  })

  const roleRoutes: Record<string, string> = {
    super_admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    staff: '/staff/dashboard',
  }

  revalidatePath('/', 'layout')
  redirect(roleRoutes[role] ?? '/staff/dashboard')
}

// ─── Admin Reset Password ─────────────────────────────────────────────────────
export async function adminResetPassword(employeeId: string, newPin: string) {
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
    return { error: 'Only administrators can reset PINs.' }
  }

  if (!newPin || newPin.length < 4) {
    return { error: 'PIN must be at least 4 characters.' }
  }

  const serviceClient = createServiceClient()

  // Verify PIN is unique
  const { data: existingPin } = await serviceClient
    .from('employees')
    .select('id')
    .eq('pin', newPin)
    .single()

  if (existingPin && existingPin.id !== employeeId) {
    return { error: 'This PIN is already in use.' }
  }

  // Get the target employee's auth_user_id
  const { data: targetEmployee } = await serviceClient
    .from('employees')
    .select('auth_user_id')
    .eq('id', employeeId)
    .single()

  if (!targetEmployee?.auth_user_id) {
    return { error: 'Employee auth account not found.' }
  }

  // Reset password via admin API
  const { error: authError } = await serviceClient.auth.admin.updateUserById(
    targetEmployee.auth_user_id,
    { password: newPin }
  )

  if (authError) {
    return { error: 'Failed to reset Auth PIN. Please try again.' }
  }

  // Update PIN in employees table
  const { error: dbError } = await serviceClient
    .from('employees')
    .update({ pin: newPin })
    .eq('id', employeeId)

  if (dbError) {
    return { error: 'Failed to update PIN in database. Please try again.' }
  }

  return { success: true }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  cookies().delete('user_role')
  revalidatePath('/', 'layout')
  redirect('/login')
}
