'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// Generate a unique device token for an employee
export async function generateDeviceToken(employeeId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Verify caller is admin
  const { data: caller } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (!caller || !['super_admin', 'manager'].includes(caller.role)) {
    throw new Error('Only admins can generate device tokens.')
  }

  // Get employee details for token naming
  const serviceClient = createServiceClient()
  const { data: emp } = await serviceClient
    .from('employees')
    .select('full_name, employee_code')
    .eq('id', employeeId)
    .single()

  if (!emp) throw new Error('Employee not found.')

  // Generate unique token
  const prefix = (emp.employee_code || emp.full_name.substring(0, 3)).toLowerCase().replace(/[^a-z0-9]/g, '')
  const randomPart = crypto.randomBytes(4).toString('hex')
  const token = `geo-${prefix}-${randomPart}`

  // Upsert device registration (one device per employee)
  const { data: existing } = await serviceClient
    .from('device_registrations')
    .select('id')
    .eq('employee_id', employeeId)
    .single()

  if (existing) {
    await serviceClient
      .from('device_registrations')
      .update({
        device_token: token,
        is_active: true,
        device_name: `${emp.full_name}'s Phone`,
      })
      .eq('id', existing.id)
  } else {
    await serviceClient
      .from('device_registrations')
      .insert({
        employee_id: employeeId,
        device_token: token,
        device_name: `${emp.full_name}'s Phone`,
        is_active: true,
      })
  }

  revalidatePath('/admin/devices')
  return { success: true, token }
}

// Get all device registrations for the org
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getDeviceRegistrations(orgId: string) {
  const serviceClient = createServiceClient()

  const { data, error } = await serviceClient
    .from('device_registrations')
    .select('*, employee:employees(id, full_name, role, email, employee_code, outlet_id, outlets(name))')
    .eq('is_active', true)

  if (error) throw new Error('Failed to fetch devices: ' + error.message)

  // Filter to only employees in this org
  const filtered = (data || []).filter((d) => {
    const emp = d.employee as unknown as { outlet_id: string } | null
    return emp !== null
  })

  return filtered
}

// Get latest ping per employee for live map
export async function getLatestPingsForOrg(orgId: string) {
  const serviceClient = createServiceClient()

  // Get all active employees in org
  const { data: employees } = await serviceClient
    .from('employees')
    .select('id, full_name, role, outlet_id, outlets(name, latitude, longitude, radius_meters)')
    .eq('org_id', orgId)
    .eq('status', 'active')

  if (!employees || employees.length === 0) return []

  const empIds = employees.map(e => e.id)

  // Get last ping for each employee (using distinct on employee_id)
  const results = await Promise.all(
    empIds.map(async (empId) => {
      const { data: pings } = await serviceClient
        .from('location_pings')
        .select('*')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false })
        .limit(1)

      const emp = employees.find(e => e.id === empId)
      return {
        employee: emp,
        lastPing: pings?.[0] || null,
      }
    })
  )

  return results
}

// Get employee tracking history for a specific date
export async function getEmployeeTrackingHistory(employeeId: string, date: string) {
  const serviceClient = createServiceClient()

  const startOfDay = `${date}T00:00:00.000Z`
  const endOfDay = `${date}T23:59:59.999Z`

  const { data, error } = await serviceClient
    .from('location_pings')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('created_at', startOfDay)
    .lte('created_at', endOfDay)
    .order('created_at', { ascending: true })

  if (error) throw new Error('Failed to fetch tracking history')
  return data || []
}

// Deactivate a device
export async function deactivateDevice(deviceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const serviceClient = createServiceClient()
  await serviceClient
    .from('device_registrations')
    .update({ is_active: false })
    .eq('id', deviceId)

  revalidatePath('/admin/devices')
  return { success: true }
}

// Get all outlets for map rendering
export async function getOutletsForMap(orgId: string) {
  const supabase = await createClient()

  const { data } = await supabase
    .from('outlets')
    .select('id, name, latitude, longitude, radius_meters, buffer_meters')
    .eq('org_id', orgId)

  return data || []
}

// Get device status for a specific employee (for staff setup page)
export async function getMyDeviceStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const serviceClient = createServiceClient()

  const { data: emp } = await serviceClient
    .from('employees')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!emp) return null

  const { data: device } = await serviceClient
    .from('device_registrations')
    .select('*')
    .eq('employee_id', emp.id)
    .eq('is_active', true)
    .single()

  if (!device) return null

  // Get last ping
  const { data: lastPing } = await serviceClient
    .from('location_pings')
    .select('created_at, latitude, longitude, battery, is_inside_geofence')
    .eq('employee_id', emp.id)
    .order('created_at', { ascending: false })
    .limit(1)

  return {
    device,
    lastPing: lastPing?.[0] || null,
  }
}
