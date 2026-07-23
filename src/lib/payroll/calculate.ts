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
  mediclaim_deduction: number
  net_pay: number
}

/**
 * Calculates payroll line item figures for an employee for a specific month.
 */
export function calculatePayrollForEmployee(
  employee: PayrollEmployee,
  month: number,
  year: number,
  totalWorkingDays: number,
  attendanceLogs: PayrollAttendance[],
  overlappingLeaves: PayrollLeave[],
  mediclaimPct: number = 10
): PayrollCalculationResult {
  
  // 1. Calculate Days Present & Total Hours Worked
  const daysPresentSet = new Set<string>()
  let totalHoursWorked = 0
  let lastCheckInTime: Date | null = null

  const sortedLogs = [...attendanceLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  for (const log of sortedLogs) {
    const date = new Date(log.timestamp)
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    const dateString = localDate.toISOString().split('T')[0]
    
    if (date.getMonth() + 1 !== month || date.getFullYear() !== year) continue

    if (log.type === 'check_in') {
      daysPresentSet.add(dateString)
      lastCheckInTime = date
    } else if (log.type === 'check_out' && lastCheckInTime) {
      const diffMs = date.getTime() - lastCheckInTime.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)
      totalHoursWorked += diffHours
      lastCheckInTime = null
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
    const dailyRate = totalWorkingDays > 0 ? employee.base_salary / totalWorkingDays : 0
    base_pay = dailyRate * (days_present + days_leave_paid)
  } 
  else if (employee.salary_type === 'daily') {
    base_pay = employee.base_salary * (days_present + days_leave_paid)
  } 
  else if (employee.salary_type === 'hourly') {
    base_pay = employee.base_salary * totalHoursWorked
  }

  const roundedBasePay = Math.round(base_pay * 100) / 100
  // Calculate Mediclaim Deduction based on mediclaimPct
  const mediclaim_deduction = Math.round((roundedBasePay * (mediclaimPct / 100)) * 100) / 100
  const net_pay = Math.max(0, Math.round((roundedBasePay - mediclaim_deduction) * 100) / 100)

  return {
    days_present,
    days_leave_paid,
    days_leave_unpaid,
    days_absent_unexcused,
    total_hours_worked: Math.round(totalHoursWorked * 100) / 100,
    base_pay: roundedBasePay,
    mediclaim_deduction,
    net_pay,
  }
}
