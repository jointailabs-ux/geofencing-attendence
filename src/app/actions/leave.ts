'use server'

import { createClient } from '@/lib/supabase/server'
import type { LeaveBalance, LeaveRequest } from '@/lib/types/database'

// --- Staff Actions ---

export async function getLeaveBalances(employeeId: string, year: number) {
  const supabase = await createClient()

  // First fetch org's leave types
  const { data: employee } = await supabase.from('employees').select('org_id').eq('id', employeeId).single()
  if (!employee) return []

  const { data: types } = await supabase.from('leave_types').select('*').eq('org_id', employee.org_id)
  if (!types || types.length === 0) return []

  // Optimize: Bulk check existing balances for this year to avoid N sequential queries
  const { data: existingBalances } = await supabase
    .from('leave_balances')
    .select('leave_type_id')
    .eq('employee_id', employeeId)
    .eq('year', year)

  const existingTypeIds = new Set(existingBalances?.map(b => b.leave_type_id) || [])
  const missingBalances = types.filter(t => !existingTypeIds.has(t.id))

  // Optimize: Batch insert missing balances in a single query
  if (missingBalances.length > 0) {
    const { error: insertError } = await supabase
      .from('leave_balances')
      .insert(
        missingBalances.map(t => ({
          employee_id: employeeId,
          leave_type_id: t.id,
          year: year,
          allocated_days: t.annual_allocation_days,
          used_days: 0,
        }))
      )
    
    if (insertError) {
      console.error('Error inserting missing balances in batch:', insertError.message)
    }
  }

  // Fetch and return full balances
  const { data: balances, error } = await supabase
    .from('leave_balances')
    .select('*, leave_type:leave_types(*)')
    .eq('employee_id', employeeId)
    .eq('year', year)
    .order('leave_type_id')

  if (error) {
    console.error('Error fetching balances:', error)
    return []
  }

  return balances as unknown as LeaveBalance[]
}

export async function getMyLeaveRequests(employeeId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, leave_type:leave_types(*), approver:employees(full_name)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching leave requests:', error)
    return []
  }

  return data as unknown as LeaveRequest[]
}

export async function submitLeaveRequest(
  employeeId: string,
  leaveTypeId: string,
  startDate: string,
  endDate: string,
  reason: string
) {
  const supabase = await createClient()

  // Verify overlap
  const { data: existing } = await supabase
    .from('leave_requests')
    .select('id')
    .eq('employee_id', employeeId)
    .in('status', ['pending', 'approved'])
    .lte('start_date', endDate)
    .gte('end_date', startDate)
    .limit(1)

  if (existing && existing.length > 0) {
    throw new Error('This request overlaps with an existing pending or approved leave.')
  }

  const { error } = await supabase.from('leave_requests').insert({
    employee_id: employeeId,
    leave_type_id: leaveTypeId,
    start_date: startDate,
    end_date: endDate,
    reason,
  })

  if (error) {
    console.error('Error submitting leave:', error)
    throw new Error('Failed to submit leave request')
  }

  return { success: true }
}

export async function cancelLeaveRequest(requestId: string, employeeId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('leave_requests')
    .delete()
    .eq('id', requestId)
    .eq('employee_id', employeeId)
    .eq('status', 'pending') // Can only cancel pending requests

  if (error) throw new Error('Failed to cancel request')
  return { success: true }
}

// --- Manager / Admin Actions ---

export async function getPendingLeaveRequests(orgId: string, outletId?: string | null) {
  const supabase = await createClient()
  
  const query = supabase
    .from('leave_requests')
    .select('*, employee:employees(id, full_name, role, outlet_id), leave_type:leave_types(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching pending requests:', error)
    return []
  }

  let filtered = data as unknown as LeaveRequest[]
  if (outletId) {
    filtered = filtered.filter(r => r.employee?.outlet_id === outletId)
  }

  return filtered as unknown as LeaveRequest[]
}

export async function resolveLeaveRequest(
  requestId: string,
  resolution: 'approved' | 'rejected',
  comment: string,
  approverId: string
) {
  const supabase = await createClient()

  const { data: request } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('id', requestId)
    .single()

  if (!request || request.status !== 'pending') {
    throw new Error('Request not found or already resolved')
  }

  const start = new Date(request.start_date)
  const end = new Date(request.end_date)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

  if (resolution === 'approved') {
    const year = start.getFullYear()
    
    const { data: balance } = await supabase
      .from('leave_balances')
      .select('id, used_days')
      .eq('employee_id', request.employee_id)
      .eq('leave_type_id', request.leave_type_id)
      .eq('year', year)
      .single()

    if (balance) {
      await supabase
        .from('leave_balances')
        .update({ used_days: Number(balance.used_days) + diffDays })
        .eq('id', balance.id)
    }
  }

  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: resolution,
      manager_comment: comment,
      approved_by: approverId,
      approved_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) {
    throw new Error('Failed to resolve request')
  }

  return { success: true }
}

export async function getTeamLeaveCalendar(orgId: string, month: number, year: number, outletId?: string | null) {
  const supabase = await createClient()
  
  const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, employee:employees(id, full_name, outlet_id), leave_type:leave_types(name)')
    .eq('status', 'approved')
    .lte('start_date', endDate)
    .gte('end_date', startDate)

  if (error) return []

  let filtered = data as unknown as LeaveRequest[]
  if (outletId) {
    filtered = filtered.filter(r => r.employee?.outlet_id === outletId)
  }

  return filtered
}
