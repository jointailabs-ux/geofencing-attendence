import { calculatePayrollForEmployee } from '../src/lib/payroll/calculate'

function runTests() {
  console.log('--- RUNNING PAYROLL CALCULATION TESTS ---\n')
  let passed = 0
  let failed = 0

  function assertEqual(testName: string, actual: any, expected: any) {
    if (actual === expected) {
      console.log(`✅ PASS: ${testName}`)
      passed++
    } else {
      console.error(`❌ FAIL: ${testName}\n   Expected: ${expected}\n   Actual: ${actual}`)
      failed++
    }
  }

  const month = 7
  const year = 2026
  const totalWorkingDays = 22

  // TEST 1: Full Attendance (Fixed Salary)
  const t1_result = calculatePayrollForEmployee(
    { id: '1', salary_type: 'fixed', base_salary: 22000 },
    month, year, totalWorkingDays,
    [
      // 22 check-ins for this month
      ...Array.from({ length: 22 }).map((_, i) => ({
        type: 'check_in' as const,
        timestamp: new Date(year, month - 1, i + 1, 9, 0).toISOString(),
        status: 'valid' as const
      }))
    ],
    []
  )
  assertEqual('T1 Fixed Salary Full Attendance - base_pay', t1_result.base_pay, 22000)
  assertEqual('T1 Fixed Salary Full Attendance - days_present', t1_result.days_present, 22)
  assertEqual('T1 Fixed Salary Full Attendance - absences', t1_result.days_absent_unexcused, 0)

  // TEST 2: Paid Leave (Fixed Salary)
  // Working 20 days, 2 paid leaves
  const t2_result = calculatePayrollForEmployee(
    { id: '1', salary_type: 'fixed', base_salary: 22000 },
    month, year, totalWorkingDays,
    [
      ...Array.from({ length: 20 }).map((_, i) => ({
        type: 'check_in' as const,
        timestamp: new Date(year, month - 1, i + 1, 9, 0).toISOString(),
        status: 'valid' as const
      }))
    ],
    [{ start_date: '2026-07-21', end_date: '2026-07-22', is_paid: true }]
  )
  assertEqual('T2 Fixed Salary With Paid Leave - base_pay', t2_result.base_pay, 22000) // 1000 * 22
  assertEqual('T2 Fixed Salary With Paid Leave - days_leave_paid', t2_result.days_leave_paid, 2)
  assertEqual('T2 Fixed Salary With Paid Leave - absences', t2_result.days_absent_unexcused, 0)

  // TEST 3: Unpaid Leave (Fixed Salary)
  // Working 20 days, 2 unpaid leaves
  const t3_result = calculatePayrollForEmployee(
    { id: '1', salary_type: 'fixed', base_salary: 22000 },
    month, year, totalWorkingDays,
    [
      ...Array.from({ length: 20 }).map((_, i) => ({
        type: 'check_in' as const,
        timestamp: new Date(year, month - 1, i + 1, 9, 0).toISOString(),
        status: 'valid' as const
      }))
    ],
    [{ start_date: '2026-07-21', end_date: '2026-07-22', is_paid: false }]
  )
  assertEqual('T3 Fixed Salary With Unpaid Leave - base_pay', t3_result.base_pay, 20000) // 1000 * 20
  assertEqual('T3 Fixed Salary With Unpaid Leave - days_leave_unpaid', t3_result.days_leave_unpaid, 2)
  assertEqual('T3 Fixed Salary With Unpaid Leave - absences', t3_result.days_absent_unexcused, 0)

  // TEST 4: Daily Salary
  const t4_result = calculatePayrollForEmployee(
    { id: '2', salary_type: 'daily', base_salary: 500 },
    month, year, totalWorkingDays,
    [
      ...Array.from({ length: 18 }).map((_, i) => ({
        type: 'check_in' as const,
        timestamp: new Date(year, month - 1, i + 1, 9, 0).toISOString(),
        status: 'valid' as const
      }))
    ],
    [{ start_date: '2026-07-20', end_date: '2026-07-21', is_paid: true }]
  )
  assertEqual('T4 Daily Salary - base_pay', t4_result.base_pay, 10000) // 500 * (18 + 2)
  assertEqual('T4 Daily Salary - absences', t4_result.days_absent_unexcused, 2) // 22 total - 20 (pres+leave) = 2

  // TEST 5: Hourly Salary (Partial day check-ins)
  const t5_result = calculatePayrollForEmployee(
    { id: '3', salary_type: 'hourly', base_salary: 100 },
    month, year, totalWorkingDays,
    [
      { type: 'check_in', timestamp: '2026-07-01T09:00:00Z', status: 'valid' },
      { type: 'check_out', timestamp: '2026-07-01T13:30:00Z', status: 'valid' }, // 4.5 hours
      { type: 'check_in', timestamp: '2026-07-02T10:00:00Z', status: 'valid' },
      { type: 'check_out', timestamp: '2026-07-02T17:15:00Z', status: 'valid' }, // 7.25 hours
    ],
    []
  )
  // Total hours = 11.75. Pay = 1175
  assertEqual('T5 Hourly Salary - total_hours', t5_result.total_hours_worked, 11.75)
  assertEqual('T5 Hourly Salary - base_pay', t5_result.base_pay, 1175)

  console.log(`\nTests completed: ${passed} passed, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

runTests()
