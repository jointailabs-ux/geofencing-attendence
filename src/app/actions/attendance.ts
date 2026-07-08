'use server'

import { createClient } from '@/lib/supabase/server'
import type { AttendanceLog } from '@/lib/types/database'

export async function getTodayAttendanceStatus(employeeId: string) {
  const supabase = await createClient()
  
  const todayStr = new Date().toISOString().split('T')[0]
  
  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('timestamp', `${todayStr}T00:00:00.000Z`)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching today attendance:', error)
    return null
  }

  // Returns array of logs for today, sorted by newest first
  return logs as AttendanceLog[]
}

export async function getEmployeeAttendanceHistory(employeeId: string, limit: number = 30) {
  const supabase = await createClient()
  
  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select('*, outlet:outlets(name)')
    .eq('employee_id', employeeId)
    .order('timestamp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching attendance history:', error)
    return []
  }

  return logs as unknown as AttendanceLog[]
}

export async function getOutletAttendanceToday(outletId: string) {
  const supabase = await createClient()
  
  const todayStr = new Date().toISOString().split('T')[0]
  
  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select('*, employee:employees!attendance_logs_employee_id_fkey(full_name, role)')
    .eq('outlet_id', outletId)
    .gte('timestamp', `${todayStr}T00:00:00.000Z`)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching outlet attendance today:', error)
    return []
  }

  return logs as unknown as AttendanceLog[]
}

export async function getOrgAttendanceToday(orgId: string) {
  const supabase = await createClient()
  
  const todayStr = new Date().toISOString().split('T')[0]
  
  // First get outlets to get their IDs
  const { data: outlets } = await supabase
    .from('outlets')
    .select('id')
    .eq('org_id', orgId)
    
  const outletIds = outlets?.map(o => o.id) || []
  if (outletIds.length === 0) return []

  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select('*, employee:employees!attendance_logs_employee_id_fkey(full_name, role), outlet:outlets(name)')
    .in('outlet_id', outletIds)
    .gte('timestamp', `${todayStr}T00:00:00.000Z`)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching org attendance today:', error)
    return []
  }

  return logs as unknown as AttendanceLog[]
}

export async function resolveAttendanceFlag(logId: string, resolution: 'valid' | 'manual_override', reason: string) {
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()

  if (!authData.user) {
    throw new Error('Unauthorized')
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_user_id', authData.user.id)
    .single()

  if (!employee || (employee.role !== 'manager' && employee.role !== 'super_admin')) {
    throw new Error('Unauthorized role')
  }

  const { error } = await supabase
    .from('attendance_logs')
    .update({
      status: resolution,
      override_reason: reason,
      override_by: employee.id,
    })
    .eq('id', logId)

  if (error) {
    console.error('Error resolving flag:', error)
    throw new Error('Failed to resolve flag')
  }

  return { success: true }
}
