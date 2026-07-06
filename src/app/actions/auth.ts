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

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    let message = 'An unexpected error occurred. Please try again.'

    if (error.message.includes('Invalid login credentials')) {
      message = 'Email or password is incorrect.'
    } else if (error.message.includes('Email not confirmed')) {
      message = 'Please verify your email address before logging in.'
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
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  const role = employee?.role ?? 'staff'

  const roleRoutes: Record<string, string> = {
    super_admin: '/admin/dashboard',
    manager: '/manager/dashboard',
    staff: '/staff/dashboard',
  }

  revalidatePath('/', 'layout')
  redirect(roleRoutes[role] ?? '/staff/dashboard')
}

// ─── Signup (Super Admin creates organization) ────────────────────────────────
export async function signup(formData: FormData) {
  const supabase = await createClient()
  const serviceClient = createServiceClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string
  const orgName = formData.get('orgName') as string

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  })

  if (authError) {
    if (authError.message.includes('already registered')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: authError.message }
  }

  if (!authData.user) return { error: 'Signup failed. Please try again.' }

  // 2. Create organization using service role (bypasses RLS for first-time setup)
  const { data: org, error: orgError } = await serviceClient
    .from('organizations')
    .insert({ name: orgName })
    .select()
    .single()

  if (orgError) {
    return { error: 'Failed to create organization: ' + orgError.message }
  }

  // 3. Create employee record for super admin
  const { error: empError } = await serviceClient.from('employees').insert({
    org_id: org.id,
    auth_user_id: authData.user.id,
    full_name: fullName,
    email: email,
    role: 'super_admin',
    salary_type: 'fixed',
    base_salary: 0,
    join_date: new Date().toISOString().split('T')[0],
    status: 'active',
  })

  if (empError) {
    return { error: 'Failed to create employee record: ' + empError.message }
  }

  revalidatePath('/', 'layout')
  redirect('/admin/dashboard')
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}
