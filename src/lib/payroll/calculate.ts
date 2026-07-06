export interface PayrollEmployee {
  id: string
  salary_type: 'fixed' | 'daily' | 'hourly'
  base_salary: number // Represents monthly salary, daily rate, or hourly rate
}

export interface PayrollAttendance {
  type: 'check_in' | 'check_out'
  timestamp: string 
  status: 'valid' | 'flagged' | 'manual_override'
}

export interface PayrollLeave {
  start_date: string 
  end_date: string 
  is_paid: boolean
}

export interface PayrollCalculationResult {
  days_present: number
  days_leave_paid: number
  days_leave_unpaid: number
  days_absent_unexcused: number
  total_hours_worked: number
  base_pay: number
}

/**
 * Calculates payroll line item figures for an employee for a specific month.
 * 
 * @param employee The employee details
 * @param month The month (1-12)
 * @param year The year (e.g. 2026)
 * @param totalWorkingDays Total standard working days in the month (excluding weekly offs and holidays)
 * @param attendanceLogs All valid/approved attendance logs for the employee in this month
 * @param overlappingLeaves All approved leave requests for the employee overlapping this month
 */
export function calculatePayrollForEmployee(
  employee: PayrollEmployee,
  month: number,
  year: number,
  totalWorkingDays: number,
  attendanceLogs: PayrollAttendance[],
  overlappingLeaves: PayrollLeave[]
): PayrollCalculationResult {
  
  // 1. Calculate Days Present & Total Hours Worked
  const daysPresentSet = new Set<string>()
  let totalHoursWorked = 0
  let lastCheckInTime: Date | null = null

  // Ensure logs are sorted chronologically
  const sortedLogs = [...attendanceLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  for (const log of sortedLogs) {
    const date = new Date(log.timestamp)
    // Account for local timezone when getting date string so we don't accidentally split days
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    const dateString = localDate.toISOString().split('T')[0]
    
    // Only process logs matching the target month/year
    if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue

    if (log.type === 'check_in') {
      daysPresentSet.add(dateString)
      lastCheckInTime = date
    } else if (log.type === 'check_out' && lastCheckInTime) {
      // Calculate precise hours between check-in and check-out
      const diffMs = date.getTime() - lastCheckInTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      totalHoursWorked += diffHours
      lastCheckInTime = null // Reset for next pair
    }
  }

  const days_present = daysPresentSet.size

  // 2. Calculate Leave Days
  let days_leave_paid = 0
  let days_leave_unpaid = 0

  for (const leave of overlappingLeaves) {
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)
    
    const current = new Date(start)
    while (current <= end) {
      // Only count the days of the leave that fall into the target month/year
      if (current.getMonth() + 1 === month && current.getFullYear() === year) {
        if (leave.is_paid) days_leave_paid++
        else days_leave_unpaid++
      }
      current.setDate(current.getDate() + 1)
    }
  }

  // 3. Calculate Unexcused Absences
  const expectedPresentDays = totalWorkingDays - (days_leave_paid + days_leave_unpaid)
  const days_absent_unexcused = Math.max(0, expectedPresentDays - days_present)

  // 4. Calculate Base Pay based on Salary Type
  let base_pay = 0

  if (employee.salary_type === 'fixed') {
    // Fixed: (Monthly Salary / Total Working Days) * (Days Present + Paid Leave)
    const dailyRate = totalWorkingDays > 0 ? employee.base_salary / totalWorkingDays : 0
    base_pay = dailyRate * (days_present + days_leave_paid)
  } 
  else if (employee.salary_type === 'daily') {
    // Daily: Daily Rate * (Days Present + Paid Leave)
    base_pay = employee.base_salary * (days_present + days_leave_paid)
  } 
  else if (employee.salary_type === 'hourly') {
    // Hourly: Hourly Rate * Total Hours Worked
    base_pay = employee.base_salary * totalHoursWorked
  }

  return {
    days_present,
    days_leave_paid,
    days_leave_unpaid,
    days_absent_unexcused,
    total_hours_worked: Math.round(totalHoursWorked * 100) / 100,
    base_pay: Math.round(base_pay * 100) / 100
  }
}
