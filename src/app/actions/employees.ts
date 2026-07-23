'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const EmployeeSchema = z.object({
  employee_code: z.string().min(1, 'Employee ID is required').max(20),
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address'),
  pin: z.string().length(6, 'PIN must be 6 digits').optional(),
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

// ─── Create employee (Admin creates auth account with password) ─────────────
export async function createEmployee(formData: FormData) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }
  if (caller.role !== 'super_admin' && caller.role !== 'manager') {
    return { error: 'Insufficient permissions' }
  }

  const raw = {
    employee_code: formData.get('employee_code'),
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    pin: formData.get('pin') || undefined,
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

  // PIN is required for new employees
  if (!parsed.data.pin) {
    return { error: '6-Digit PIN is required for new employees' }
  }

  // Manager can only create staff in their own outlet
  if (caller.role === 'manager') {
    if (parsed.data.role !== 'staff') {
      return { error: 'Managers can only create staff members' }
    }
    parsed.data.outlet_id = caller.outlet_id ?? ''
  }

  const serviceClient = createServiceClient()

  // Check if employee_code is unique within org
  const { data: existingCode } = await serviceClient
    .from('employees')
    .select('id')
    .eq('org_id', caller.org_id)
    .eq('employee_code', parsed.data.employee_code)
    .limit(1)

  if (existingCode && existingCode.length > 0) {
    return { error: `Employee ID "${parsed.data.employee_code}" is already in use.` }
  }

  // Check if PIN is unique
  const { data: existingPin } = await serviceClient
    .from('employees')
    .select('id')
    .eq('pin', parsed.data.pin)
    .limit(1)

  if (existingPin && existingPin.length > 0) {
    return { error: `This PIN is already in use by another employee.` }
  }

  // 1. Create auth user with email + pin (as password) (no invite email needed)
  const { data: authData, error: authError } = await serviceClient.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.pin,
    email_confirm: true, // Mark email as verified immediately
    user_metadata: { full_name: parsed.data.full_name },
  })

  if (authError) {
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      return { error: 'An account with this email already exists.' }
    }
    return { error: 'Failed to create user account. Please try again.' }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account. Please try again.' }
  }

  // 2. Create employee record
  const { error: empError } = await serviceClient.from('employees').insert({
    org_id: caller.org_id,
    auth_user_id: authData.user.id,
    employee_code: parsed.data.employee_code,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    pin: parsed.data.pin,
    phone: parsed.data.phone ?? null,
    role: parsed.data.role,
    outlet_id: parsed.data.outlet_id || null,
    salary_type: parsed.data.salary_type,
    base_salary: parsed.data.base_salary,
    join_date: parsed.data.join_date,
    status: 'active',
  })

  if (empError) {
    // Rollback: delete the auth user we just created
    await serviceClient.auth.admin.deleteUser(authData.user.id)
    return { error: 'Failed to create employee record. Please try again.' }
  }

  revalidatePath('/admin/employees')
  redirect('/admin/employees')
}

// ─── Update employee ────────────────────────────────────────────────────────────
export async function updateEmployee(employeeId: string, formData: FormData) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }

  const raw = {
    employee_code: formData.get('employee_code'),
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone') || undefined,
    role: formData.get('role'),
    outlet_id: formData.get('outlet_id') || undefined,
    salary_type: formData.get('salary_type'),
    base_salary: formData.get('base_salary'),
    join_date: formData.get('join_date'),
  }

  // PIN not required for updates
  const UpdateSchema = EmployeeSchema.omit({ pin: true })
  const parsed = UpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.issues.map((e: { message: string }) => e.message).join(', ') }
  }

  const serviceClient = createServiceClient()

  // Check employee_code uniqueness (exclude current employee)
  const { data: existingCode } = await serviceClient
    .from('employees')
    .select('id')
    .eq('org_id', caller.org_id)
    .eq('employee_code', parsed.data.employee_code)
    .neq('id', employeeId)
    .limit(1)

  if (existingCode && existingCode.length > 0) {
    return { error: `Employee ID "${parsed.data.employee_code}" is already in use by another employee.` }
  }

  const { error } = await serviceClient
    .from('employees')
    .update({
      employee_code: parsed.data.employee_code,
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

  if (error) return { error: 'Failed to update employee. Please try again.' }

  revalidatePath('/admin/employees')
  revalidatePath('/admin/dashboard')
  revalidatePath('/manager/dashboard')
  redirect('/admin/employees')
}

// ─── Deactivate employee (soft delete) ─────────────────────────────────────────
export async function deactivateEmployee(employeeId: string) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }

  const serviceClient = createServiceClient()

  // Also disable the auth user to prevent login
  const { data: emp } = await serviceClient
    .from('employees')
    .select('auth_user_id')
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)
    .single()

  if (emp?.auth_user_id) {
    await serviceClient.auth.admin.updateUserById(emp.auth_user_id, {
      ban_duration: '876000h', // ~100 years effectively permanent ban
    })
  }

  const { error } = await serviceClient
    .from('employees')
    .update({ status: 'inactive' })
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)

  if (error) return { error: 'Failed to deactivate employee.' }

  revalidatePath('/admin/employees')
  return { success: true }
}

// ─── Delete employee ─────────────────────────────────────────────────────────────
export async function deleteEmployee(employeeId: string) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }
  if (caller.role !== 'super_admin') return { error: 'Only Super Admins can delete staff' }

  const serviceClient = createServiceClient()

  // Find auth_user_id
  const { data: emp } = await serviceClient
    .from('employees')
    .select('auth_user_id')
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)
    .single()

  // Try deleting employee record
  const { error } = await serviceClient
    .from('employees')
    .delete()
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)

  if (error) {
    // Fallback if foreign key references exist (e.g. attendance logs): soft-delete
    await serviceClient
      .from('employees')
      .update({ status: 'inactive', outlet_id: null })
      .eq('id', employeeId)
      .eq('org_id', caller.org_id)
  }

  if (emp?.auth_user_id) {
    try {
      await serviceClient.auth.admin.deleteUser(emp.auth_user_id)
    } catch (e) {
      console.warn('Could not delete auth user', e)
    }
  }

  revalidatePath('/admin/employees')
  revalidatePath('/admin/dashboard')
  revalidatePath('/manager/dashboard')
  return { success: true }
}

// ─── Reactivate employee ────────────────────────────────────────────────────────
export async function reactivateEmployee(employeeId: string) {
  const caller = await getCallerEmployee()
  if (!caller) return { error: 'Unauthorized' }

  const serviceClient = createServiceClient()

  // Unban the auth user
  const { data: emp } = await serviceClient
    .from('employees')
    .select('auth_user_id')
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)
    .single()

  if (emp?.auth_user_id) {
    await serviceClient.auth.admin.updateUserById(emp.auth_user_id, {
      ban_duration: 'none',
    })
  }

  const { error } = await serviceClient
    .from('employees')
    .update({ status: 'active' })
    .eq('id', employeeId)
    .eq('org_id', caller.org_id)

  if (error) return { error: 'Failed to reactivate employee.' }

  revalidatePath('/admin/employees')
  revalidatePath('/admin/dashboard')
  revalidatePath('/manager/dashboard')
  return { success: true }
}
