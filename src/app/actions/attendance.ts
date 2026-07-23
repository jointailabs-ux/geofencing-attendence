'use server'

import { createClient } from '@/lib/supabase/server'
import type { AttendanceLog } from '@/lib/types/database'
import { getISTDateString, getISTStartOfDay, getISTEndOfDay } from '@/lib/utils'

export async function getTodayAttendanceStatus(employeeId: string) {
  const supabase = await createClient()
  
  const start = getISTStartOfDay().toISOString()
  const end = getISTEndOfDay().toISOString()
  
  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('timestamp', start)
    .lte('timestamp', end)
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
  
  const start = getISTStartOfDay().toISOString()
  const end = getISTEndOfDay().toISOString()
  
  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select('*, employee:employees!attendance_logs_employee_id_fkey(full_name, role)')
    .eq('outlet_id', outletId)
    .gte('timestamp', start)
    .lte('timestamp', end)
    .order('timestamp', { ascending: false })

  if (error) {
    console.error('Error fetching outlet attendance today:', error)
    return []
  }

  return logs as unknown as AttendanceLog[]
}

export async function getOrgAttendanceToday(orgId: string) {
  const supabase = await createClient()
  
  const start = getISTStartOfDay().toISOString()
  const end = getISTEndOfDay().toISOString()

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
    .gte('timestamp', start)
    .lte('timestamp', end)
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

export type DailySummary = {
  employee_id: string
  employee_name: string
  role: string
  outlet_name: string
  first_check_in: string | null
  last_check_out: string | null
  total_hours: number
  has_flags: boolean
  raw_logs: AttendanceLog[]
}

export async function getDailyAttendanceSummary(orgId: string, dateStr: string): Promise<DailySummary[]> {
  const supabase = await createClient()
  
  // Get all outlets for this org
  const { data: outlets } = await supabase
    .from('outlets')
    .select('id, name')
    .eq('org_id', orgId)
    
  const outletIds = outlets?.map(o => o.id) || []
  if (outletIds.length === 0) return []

  const outletMap = new Map(outlets?.map(o => [o.id, o.name]))

  // Fetch logs for the entire day (00:00 to 23:59:59)
  const { data: logs, error } = await supabase
    .from('attendance_logs')
    .select('*, employee:employees!attendance_logs_employee_id_fkey(full_name, role), outlet:outlets(name)')
    .in('outlet_id', outletIds)
    .gte('timestamp', `${dateStr}T00:00:00.000Z`)
    .lte('timestamp', `${dateStr}T23:59:59.999Z`)
    .order('timestamp', { ascending: true }) // Ascending for chronological processing

  if (error) {
    console.error('Error fetching daily summary:', error)
    return []
  }

  const typedLogs = logs as unknown as AttendanceLog[]

  // Group by employee
  const employeeMap = new Map<string, DailySummary>()

  for (const log of typedLogs) {
    if (!employeeMap.has(log.employee_id)) {
      employeeMap.set(log.employee_id, {
        employee_id: log.employee_id,
        employee_name: log.employee?.full_name || 'Unknown',
        role: log.employee?.role || 'staff',
        outlet_name: log.outlet?.name || outletMap.get(log.outlet_id) || 'Unknown Outlet',
        first_check_in: null,
        last_check_out: null,
        total_hours: 0,
        has_flags: false,
        raw_logs: [],
      })
    }
    const summary = employeeMap.get(log.employee_id)!
    summary.raw_logs.push(log)

    if (log.status === 'flagged') {
      summary.has_flags = true
    }
  }

  // Calculate hours worked (pair check-ins and check-outs)
  for (const summary of Array.from(employeeMap.values())) {
    let currentCheckIn: Date | null = null
    let totalMs = 0

    // Reverse the raw logs when displaying them so newest is first in the UI,
    // but process them chronologically here to pair correctly
    for (const log of summary.raw_logs) {
      if (log.type === 'check_in') {
        if (summary.first_check_in === null) {
          summary.first_check_in = log.timestamp
        }
        currentCheckIn = new Date(log.timestamp)
      } else if (log.type === 'check_out') {
        summary.last_check_out = log.timestamp
        if (currentCheckIn) {
          const checkOutTime = new Date(log.timestamp)
          totalMs += checkOutTime.getTime() - currentCheckIn.getTime()
          currentCheckIn = null // Reset for next pair
        }
      }
    }

    // If they checked in but haven't checked out yet, calculate up to CURRENT time (if the date is today)
    if (currentCheckIn && dateStr === getISTDateString()) {
      totalMs += new Date().getTime() - currentCheckIn.getTime()
    }

    summary.total_hours = totalMs / (1000 * 60 * 60)
    // Reverse for UI display (newest first)
    summary.raw_logs.reverse()
  }

  return Array.from(employeeMap.values()).sort((a, b) => b.total_hours - a.total_hours)
}
