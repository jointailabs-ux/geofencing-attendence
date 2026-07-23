'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculatePayrollForEmployee, type PayrollEmployee, type PayrollAttendance } from '@/lib/payroll/calculate'
import type { PayrollRun, PayrollLineItem } from '@/lib/types/database'

export async function generateDraftPayroll(orgId: string, month: number, year: number, mediclaimPct: number = 10) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // 1. Check if run already exists
  const { data: existingRun } = await supabase
    .from('payroll_runs')
    .select('id, status')
    .eq('org_id', orgId)
    .eq('month', month)
    .eq('year', year)
    .single()

  if (existingRun && existingRun.status === 'finalized') {
    throw new Error('Payroll run for this month is already finalized.')
  }

  // Determine standard working days
  const { data: holidays } = await supabase
    .from('holidays')
    .select('date')
    .eq('org_id', orgId)

  // Calculate days in month
  const daysInMonth = new Date(year, month, 0).getDate()
  let totalWorkingDays = daysInMonth
  
  // Subtract Sundays
  for (let d = 1; d <= daysInMonth; d++) {
    if (new Date(year, month - 1, d).getDay() === 0) totalWorkingDays--
  }
  
  // Subtract holidays that fall on non-Sundays in this month
  if (holidays) {
    for (const h of holidays) {
      const hd = new Date(h.date)
      if (hd.getMonth() + 1 === month && hd.getFullYear() === year && hd.getDay() !== 0) {
        totalWorkingDays--
      }
    }
  }

  // Fetch all active employees in org
  const { data: employees } = await supabase
    .from('employees')
    .select('id, salary_type, base_salary')
    .eq('org_id', orgId)
    .eq('status', 'active')

  if (!employees || employees.length === 0) throw new Error('No active employees found.')

  let runId = existingRun?.id

  // Create or Update Run
  if (!runId) {
    const { data: newRun, error: runError } = await supabase
      .from('payroll_runs')
      .insert({ org_id: orgId, month, year, status: 'draft' })
      .select('id')
      .single()
      
    if (runError) throw new Error('Failed to create payroll run.')
    runId = newRun.id
  } else {
    // Delete existing line items if regenerating draft
    await supabase.from('payroll_line_items').delete().eq('payroll_run_id', runId)
  }

  // Generate line items in bulk to fix N+1 query performance bottleneck
  const empIds = employees.map(emp => emp.id)
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Query all attendance logs and leave requests for all employees in parallel
  const [
    { data: allAttendance, error: attError },
    { data: allLeaves, error: leaveError }
  ] = await Promise.all([
    supabase
      .from('attendance_logs')
      .select('employee_id, type, timestamp, status')
      .in('employee_id', empIds)
      .in('status', ['valid', 'manual_override']),
    supabase
      .from('leave_requests')
      .select('employee_id, start_date, end_date, leave_types(is_paid)')
      .in('employee_id', empIds)
      .eq('status', 'approved')
      .lte('start_date', endDate)
      .gte('end_date', startDate)
  ])

  if (attError) throw new Error('Failed to fetch attendance logs: ' + attError.message)
  if (leaveError) throw new Error('Failed to fetch leave requests: ' + leaveError.message)

  // Index logs and leaves by employee_id for O(1) retrieval
  const attendanceByEmp: Record<string, typeof allAttendance> = {}
  allAttendance?.forEach(log => {
    if (!attendanceByEmp[log.employee_id]) attendanceByEmp[log.employee_id] = []
    attendanceByEmp[log.employee_id].push(log)
  })

  const leavesByEmp: Record<string, typeof allLeaves> = {}
  allLeaves?.forEach(req => {
    if (!leavesByEmp[req.employee_id]) leavesByEmp[req.employee_id] = []
    leavesByEmp[req.employee_id].push(req)
  })

  const lineItemsToInsert = employees.map(emp => {
    const attendance = attendanceByEmp[emp.id] || []
    const leaves = leavesByEmp[emp.id] || []

    const formattedLeaves = leaves.map(l => ({
      start_date: l.start_date,
      end_date: l.end_date,
      is_paid: Boolean((l.leave_types as unknown as { is_paid: boolean })?.is_paid)
    }))

    // Calculate with mediclaimPct
    const calc = calculatePayrollForEmployee(
      emp as unknown as PayrollEmployee, 
      month, 
      year, 
      totalWorkingDays, 
      attendance as unknown as PayrollAttendance[], 
      formattedLeaves,
      mediclaimPct
    )

    return {
      payroll_run_id: runId,
      employee_id: emp.id,
      days_present: calc.days_present,
      days_leave_paid: calc.days_leave_paid,
      days_leave_unpaid: calc.days_leave_unpaid,
      days_absent_unexcused: calc.days_absent_unexcused,
      base_pay: calc.base_pay,
      deductions: calc.mediclaim_deduction,
      deduction_note: `Mediclaim Deduction (${mediclaimPct}%)`,
      net_pay: calc.net_pay
    }
  })

  // Bulk insert all line items at once
  const { error: insertError } = await supabase
    .from('payroll_line_items')
    .insert(lineItemsToInsert)

  if (insertError) {
    console.error('Error batch inserting payroll line items:', insertError.message)
    throw new Error('Failed to save payroll line items: ' + insertError.message)
  }

  return { success: true, runId }
}

export async function getPayrollRunDetails(runId: string) {
  const supabase = await createClient()
  
  const { data: run, error } = await supabase
    .from('payroll_runs')
    .select('*, payroll_line_items(*, employee:employees(id, full_name, role, base_salary, salary_type, outlets(name)))')
    .eq('id', runId)
    .single()

  if (error) throw new Error('Failed to fetch run')

  // Check if any active employee is missing from this run
  const { data: activeEmps } = await supabase
    .from('employees')
    .select('id, salary_type, base_salary')
    .eq('org_id', run.org_id)
    .eq('status', 'active')

  if (activeEmps && activeEmps.length > 0 && run.status !== 'finalized') {
    const existingEmpIds = new Set((run.payroll_line_items || []).map((li: { employee_id: string }) => li.employee_id))
    const missingEmps = activeEmps.filter((emp) => !existingEmpIds.has(emp.id))

    if (missingEmps.length > 0) {
      const lineItemsToInsert = missingEmps.map((emp) => {
        const roundedBasePay = Number(emp.base_salary) || 0
        const mediclaim_deduction = Math.round((roundedBasePay * 0.2) * 100) / 100
        const net_pay = Math.max(0, Math.round((roundedBasePay - mediclaim_deduction) * 100) / 100)

        return {
          payroll_run_id: runId,
          employee_id: emp.id,
          days_present: 0,
          days_leave_paid: 0,
          days_leave_unpaid: 0,
          days_absent_unexcused: 0,
          base_pay: roundedBasePay,
          deductions: mediclaim_deduction,
          deduction_note: 'Mediclaim Deduction (20%)',
          net_pay: net_pay,
        }
      })

      await supabase.from('payroll_line_items').insert(lineItemsToInsert)

      // Re-fetch updated run with missing line items added
      const { data: updatedRun } = await supabase
        .from('payroll_runs')
        .select('*, payroll_line_items(*, employee:employees(id, full_name, role, base_salary, salary_type, outlets(name)))')
        .eq('id', runId)
        .single()

      if (updatedRun) return updatedRun as unknown as PayrollRun & { payroll_line_items: PayrollLineItem[] }
    }
  }

  return run as unknown as PayrollRun & { payroll_line_items: PayrollLineItem[] }
}

export async function updateLineItemAdjustments(
  lineItemId: string, 
  updates: { manual_adjustments: number, adjustment_note: string, deductions: number, deduction_note: string, base_pay: number }
) {
  const supabase = await createClient()
  
  const net_pay = updates.base_pay + updates.manual_adjustments - updates.deductions

  const { error } = await supabase
    .from('payroll_line_items')
    .update({
      manual_adjustments: updates.manual_adjustments,
      adjustment_note: updates.adjustment_note,
      deductions: updates.deductions,
      deduction_note: updates.deduction_note,
      net_pay: net_pay
    })
    .eq('id', lineItemId)

  if (error) throw new Error('Failed to update line item')
  return { success: true }
}

export async function finalizePayrollRun(runId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: employee } = await supabase.from('employees').select('id').eq('auth_user_id', user.id).single()

  const { error } = await supabase
    .from('payroll_runs')
    .update({ 
      status: 'finalized', 
      finalized_at: new Date().toISOString(),
      finalized_by: employee?.id 
    })
    .eq('id', runId)

  if (error) throw new Error('Failed to finalize run')

  revalidatePath('/staff/payslips')
  revalidatePath('/staff/profile')
  revalidatePath('/admin/payroll')
  return { success: true }
}

export async function sendIndividualPayslip(lineItemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: lineItem, error: fetchErr } = await supabase
    .from('payroll_line_items')
    .select('*, employee:employees(full_name)')
    .eq('id', lineItemId)
    .single()

  if (fetchErr || !lineItem) throw new Error('Line item not found')

  const empName = (lineItem.employee as unknown as { full_name: string })?.full_name || 'Staff Member'
  const currentNote = lineItem.adjustment_note || ''
  const newNote = currentNote.includes('Sent')
    ? currentNote
    : currentNote
    ? `${currentNote} (Sent to Staff Profile)`
    : 'Sent to Staff Profile'

  const { error: updateErr } = await supabase
    .from('payroll_line_items')
    .update({
      adjustment_note: newNote,
    })
    .eq('id', lineItemId)

  if (updateErr) throw new Error('Failed to update line item: ' + updateErr.message)

  revalidatePath('/staff/payslips')
  revalidatePath('/staff/profile')
  revalidatePath('/admin/payroll')

  return { success: true, employeeName: empName }
}

export async function getAllPayrollRuns(orgId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('payroll_runs')
    .select('*, finalized_by_emp:employees(full_name)')
    .eq('org_id', orgId)
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) throw new Error('Failed to fetch runs')
  return data
}
