// ─── Database types generated from Supabase schema ───────────────────────────

export type EmployeeRole = 'super_admin' | 'manager' | 'staff'
export type SalaryType = 'fixed' | 'daily' | 'hourly'
export type EmployeeStatus = 'active' | 'inactive'
export type AttendanceType = 'check_in' | 'check_out'
export type AttendanceStatus = 'valid' | 'flagged' | 'manual_override'

export interface Organization {
  id: string
  name: string
  created_at: string
}

export interface Outlet {
  id: string
  org_id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  radius_meters: number
  buffer_meters: number
  created_at: string
  updated_at: string
  // Joined fields
  employee_count?: number
}

export interface Employee {
  id: string
  org_id: string
  outlet_id: string | null
  auth_user_id: string | null
  full_name: string
  phone: string | null
  email: string
  role: EmployeeRole
  salary_type: SalaryType
  base_salary: number
  join_date: string
  status: EmployeeStatus
  created_at: string
  updated_at: string
  // Joined fields
  outlet?: Pick<Outlet, 'id' | 'name'>
}

export interface AttendanceLog {
  id: string
  employee_id: string
  outlet_id: string
  type: AttendanceType
  timestamp: string
  submitted_lat: number
  submitted_lng: number
  gps_accuracy_meters: number
  distance_from_outlet_meters: number
  status: AttendanceStatus
  override_reason: string | null
  override_by: string | null // references employee_id
  created_at: string
  
  // Joined fields
  employee?: Pick<Employee, 'id' | 'full_name' | 'role'>
  outlet?: Pick<Outlet, 'id' | 'name'>
  overridden_by_employee?: Pick<Employee, 'id' | 'full_name'>
}

export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface LeaveType {
  id: string
  org_id: string
  name: string
  is_paid: boolean
  annual_allocation_days: number
  created_at: string
}

export interface LeaveBalance {
  id: string
  employee_id: string
  leave_type_id: string
  year: number
  allocated_days: number
  used_days: number
  created_at: string
  
  // Joined fields
  leave_type?: LeaveType
}

export interface LeaveRequest {
  id: string
  employee_id: string
  leave_type_id: string
  start_date: string
  end_date: string
  reason: string
  status: LeaveStatus
  approved_by: string | null
  approved_at: string | null
  manager_comment: string | null
  created_at: string
  
  // Joined fields
  employee?: Pick<Employee, 'id' | 'full_name' | 'role' | 'outlet_id'>
  leave_type?: LeaveType
  approver?: Pick<Employee, 'id' | 'full_name'>
}

export type PayrollStatus = 'draft' | 'finalized'

export interface Holiday {
  id: string
  org_id: string
  date: string // YYYY-MM-DD
  name: string
  created_at: string
}

export interface PayrollRun {
  id: string
  org_id: string
  month: number
  year: number
  status: PayrollStatus
  generated_at: string
  finalized_at: string | null
  finalized_by: string | null
  created_at: string
}

export interface PayrollLineItem {
  id: string
  payroll_run_id: string
  employee_id: string
  days_present: number
  days_leave_paid: number
  days_leave_unpaid: number
  days_absent_unexcused: number
  base_pay: number
  overtime_pay: number
  manual_adjustments: number
  adjustment_note: string | null
  deductions: number
  deduction_note: string | null
  net_pay: number
  created_at: string
  
  // Joined fields
  payroll_run?: PayrollRun
  employee?: Pick<Employee, 'id' | 'full_name' | 'role' | 'base_salary' | 'salary_type'> & {
    outlet?: { name: string }
  }
}

// ─── Session / auth types ────────────────────────────────────────────────────

export interface UserSession {
  id: string
  email: string
  employee: Employee | null
}
