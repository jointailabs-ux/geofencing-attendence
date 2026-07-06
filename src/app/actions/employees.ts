'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const EmployeeSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.enum(['super_admin', 'manager', 'staff']),
  outlet_id: z.string().uuid().optional().or(z.literal('')),
  salary_type: z.enum(['fixed', 'daily', 'hourly']),
  base_salary: z.coerce.number().min(0, 'Salary must be positive'),
  join_date: z.string().min(1, 'Join date is required'),
})

async function getCallerEmployee() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from('employees')
    .select('org_id, outlet_id, role')
    .eq('auth_user_id', user.id)
    .single()

  return employee
}

// ─── Create employee (with Supabase Auth invite) ───────────────────────────────
export async function createEmployee(formData: FormData) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }
  if (caller.role !== 'super_admin' && caller.role !== 'manager') {
    return { error: 'Insufficient permissions' }
  }

  const raw = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    role: formData.get('role'),
    outlet_id: formData.get('outlet_id') || undefined,
    salary_type: formData.get('salary_type'),
    base_salary: formData.get('base_salary'),
    join_date: formData.get('join_date'),
  }

  const parsed = EmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e: { message: string }) => e.message).join(', ')
    return { error: messages }
  }

  // Manager can only create staff in their own outlet
  if (caller.role === 'manager') {
    if (parsed.data.role !== 'staff') {
      return { error: 'Managers can only create staff members' }
    }
    parsed.data.outlet_id = caller.outlet_id ?? ''
  }

  const serviceClient = createServiceClient()

  // 1. Invite user via Supabase Auth — sends an email invite
  const { data: authData, error: authError } = await serviceClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { full_name: parsed.data.full_name },
    }
  )

  if (authError) {
    // If user already exists in auth, we can still create the employee record
    if (!authError.message.includes('already been registered')) {
      return { error: 'Failed to invite user: ' + authError.message }
    }
  }

  // 2. Create employee record
  const { error: empError } = await serviceClient.from('employees').insert({
    org_id: caller.org_id,
    auth_user_id: authData?.user?.id ?? null,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone ?? null,
    role: parsed.data.role,
    outlet_id: parsed.data.outlet_id || null,
    salary_type: parsed.data.salary_type,
    base_salary: parsed.data.base_salary,
    join_date: parsed.data.join_date,
    status: 'active',
  })

  if (empError) return { error: empError.message }

  revalidatePath('/admin/employees')
  redirect('/admin/employees')
}

// ─── Update employee ────────────────────────────────────────────────────────────
export async function updateEmployee(employeeId: string, formData: FormData) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }

  const raw = {
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    role: formData.get('role'),
    outlet_id: formData.get('outlet_id') || undefined,
    salary_type: formData.get('salary_type'),
    base_salary: formData.get('base_salary'),
    join_date: formData.get('join_date'),
  }

  const parsed = EmployeeSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') }
  }

  const serviceClient = createServiceClient()

  const { error } = await serviceClient
    .from('employees')
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone ?? null,
      role: parsed.data.role,
      outlet_id: parsed.data.outlet_id || null,
      salary_type: parsed.data.salary_type,
      base_salary: parsed.data.base_salary,
      join_date: parsed.data.join_date,
    })
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/employees')
  redirect('/admin/employees')
}

// ─── Deactivate employee (soft delete) ─────────────────────────────────────────
export async function deactivateEmployee(employeeId: string) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('employees')
    .update({ status: 'inactive' })
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/employees')
  return { success: true }
}

// ─── Reactivate employee ────────────────────────────────────────────────────────
export async function reactivateEmployee(employeeId: string) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }

  const serviceClient = createServiceClient()
  const { error } = await serviceClient
    .from('employees')
    .update({ status: 'active' })
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)

  if (error) return { error: error.message }

  revalidatePath('/admin/employees')
  return { success: true }
}
