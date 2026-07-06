'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAdminDashboardStats(orgId: string) {
  const supabase = await createClient()

  // 1. Basic Counts
  const { count: outletCount } = await supabase.from('outlets').select('*', { count: 'exact', head: true }).eq('org_id', orgId)
  const { count: employeeCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('org_id', orgId)
  
  // 2. Today's Attendance %
  const todayDateStr = new Date().toISOString().split('T')[0]
  const startOfDay = new Date(todayDateStr).toISOString()
  
  const { data: orgOutlets } = await supabase.from('outlets').select('id').eq('org_id', orgId)
  const outletIds = orgOutlets?.map(o => o.id) || []
  
  const { data: checkinsToday } = await supabase
    .from('attendance_logs')
    .select('employee_id')
    .in('outlet_id', outletIds)
    .eq('type', 'check_in')
    .gte('timestamp', startOfDay)
    
  const uniquePresent = new Set(checkinsToday?.map(l => l.employee_id)).size
  const attendancePercentage = employeeCount ? Math.round((uniquePresent / employeeCount) * 100) : 0

  // 3. Pending Leave Requests
  const { count: pendingLeaves } = await supabase
    .from('leave_requests')
    .select('*, employee:employees!inner(org_id)', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('employee.org_id', orgId)

  // 4. Current Month Payroll Cost
  const currMonth = new Date().getMonth() + 1
  const currYear = new Date().getFullYear()
  const { data: currPayroll } = await supabase
    .from('payroll_runs')
    .select('id')
    .eq('org_id', orgId)
    .eq('month', currMonth)
    .eq('year', currYear)
    .single()
    
  let payrollCost = 0
  if (currPayroll) {
    const { data: lineItems } = await supabase
      .from('payroll_line_items')
      .select('net_pay')
      .eq('payroll_run_id', currPayroll.id)
    payrollCost = lineItems?.reduce((acc, curr) => acc + Number(curr.net_pay), 0) || 0
  }

  // 5. Per-outlet breakdown
  const { data: outletsStatsData } = await supabase
    .from('outlets')
    .select('id, name, employees(id)')
    .eq('org_id', orgId)
    
  const outletBreakdown = outletsStatsData?.map(o => {
    const empCount = o.employees?.length || 0
    const presentCount = checkinsToday?.filter(l => (o.employees as unknown as { id: string }[])?.some(e => e.id === l.employee_id))?.length || 0
    return {
      id: o.id,
      name: o.name,
      employeeCount: empCount,
      attendancePercentage: empCount ? Math.round((presentCount / empCount) * 100) : 0
    }
  }) || []

  // 6. Recent Activity Feed
  const { data: recentCheckins } = await supabase
    .from('attendance_logs')
    .select('id, type, timestamp, status, employee:employees!inner(full_name, org_id)')
    .eq('employee.org_id', orgId)
    .order('timestamp', { ascending: false })
    .limit(5)
    
  const { data: recentLeaves } = await supabase
    .from('leave_requests')
    .select('id, created_at, status, employee:employees!inner(full_name, org_id), leave_type:leave_types(name)')
    .eq('employee.org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)

  // Combine and sort
  const combinedActivity = [
    ...(recentCheckins || []).map(c => ({
      id: `checkin-${c.id}`,
      type: c.type === 'check_in' ? 'Check In' : 'Check Out',
      timestamp: c.timestamp,
      employee_name: (c.employee as unknown as { full_name: string }).full_name,
      status: c.status,
      detail: ''
    })),
    ...(recentLeaves || []).map(l => ({
      id: `leave-${l.id}`,
      type: 'Leave Request',
      timestamp: l.created_at,
      employee_name: (l.employee as unknown as { full_name: string }).full_name,
      status: l.status,
      detail: (l.leave_type as unknown as { name: string })?.name
    }))
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8)

  return {
    metrics: {
      outletCount: outletCount || 0,
      employeeCount: employeeCount || 0,
      attendancePercentage,
      pendingLeaves: pendingLeaves || 0,
      payrollCost
    },
    outletBreakdown,
    recentActivity: combinedActivity
  }
}

export async function getAttendanceTrend(orgId: string) {
  const supabase = await createClient()
  
  // Last 30 days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 29)
  
  const { data: orgOutlets } = await supabase.from('outlets').select('id').eq('org_id', orgId)
  const outletIds = orgOutlets?.map(o => o.id) || []
  
  const { count: totalEmployees } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'active')
  
  if (!totalEmployees || outletIds.length === 0) return []

  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('timestamp, employee_id')
    .in('outlet_id', outletIds)
    .eq('type', 'check_in')
    .gte('timestamp', startDate.toISOString())
    .lte('timestamp', endDate.toISOString())
    
  // Group by date
  const trendMap = new Map<string, Set<string>>()
  
  if (logs) {
    for (const log of logs) {
      const dateStr = log.timestamp.split('T')[0]
      if (!trendMap.has(dateStr)) trendMap.set(dateStr, new Set())
      trendMap.get(dateStr)!.add(log.employee_id)
    }
  }
  
  const trend = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const present = trendMap.get(dateStr)?.size || 0
    
    // Only calculate % for weekdays for a cleaner chart (optional, but let's just do raw %)
    const percentage = Math.round((present / totalEmployees) * 100)
    
    trend.push({
      date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      attendance: percentage
    })
  }
  
  
  return trend
}

export async function getManagerDashboardStats(outletId: string) {
  const supabase = await createClient()

  // 1. Employee Count
  const { count: staffCount } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('outlet_id', outletId)
    .eq('status', 'active')

  // 2. Pending Leave Approvals
  const { count: pendingLeaves } = await supabase
    .from('leave_requests')
    .select('*, employee:employees!inner(outlet_id)', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('employee.outlet_id', outletId)

  // 3. Live Roster (Today)
  const todayDateStr = new Date().toISOString().split('T')[0]
  const startOfDay = new Date(todayDateStr).toISOString()

  // All active employees in outlet
  const { data: employees } = await supabase
    .from('employees')
    .select('id, full_name, role')
    .eq('outlet_id', outletId)
    .eq('status', 'active')

  // All logs today for outlet
  const { data: todayLogs } = await supabase
    .from('attendance_logs')
    .select('employee_id, type, timestamp, status')
    .eq('outlet_id', outletId)
    .gte('timestamp', startOfDay)
    .order('timestamp', { ascending: true })

  let presentCount = 0
  const roster = employees?.map(emp => {
    const empLogs = todayLogs?.filter(l => l.employee_id === emp.id) || []
    
    // Determine current status
    let currentStatus: 'checked_in' | 'checked_out' | 'absent' = 'absent'
    let lastLogTime = null
    
    if (empLogs.length > 0) {
      const lastLog = empLogs[empLogs.length - 1]
      if (lastLog.type === 'check_in') {
        currentStatus = 'checked_in'
        presentCount++
      } else {
        currentStatus = 'checked_out'
        presentCount++ // Still counts as present today
      }
      lastLogTime = lastLog.timestamp
    }

    return {
      id: emp.id,
      name: emp.full_name,
      role: emp.role,
      status: currentStatus,
      lastLogTime,
      flagged: empLogs.some(l => l.status === 'flagged')
    }
  }) || []

  return {
    metrics: {
      staffCount: staffCount || 0,
      presentCount,
      pendingLeaves: pendingLeaves || 0
    },
    roster
  }
}

export async function getStaffDashboardStats(employeeId: string) {
  const supabase = await createClient()

  const currMonth = new Date().getMonth() + 1
  const currYear = new Date().getFullYear()

  // 1. This Month's Attendance
  const startOfMonth = new Date(currYear, currMonth - 1, 1).toISOString()
  const endOfMonth = new Date(currYear, currMonth, 0, 23, 59, 59).toISOString()

  const { data: logs } = await supabase
    .from('attendance_logs')
    .select('type, timestamp')
    .eq('employee_id', employeeId)
    .gte('timestamp', startOfMonth)
    .lte('timestamp', endOfMonth)

  const presentDays = new Set((logs || []).filter(l => l.type === 'check_in').map(l => l.timestamp.split('T')[0])).size

  // 2. Leaves taken this month
  const { data: leaves } = await supabase
    .from('leave_requests')
    .select('start_date, end_date')
    .eq('employee_id', employeeId)
    .eq('status', 'approved')
    .lte('start_date', endOfMonth.split('T')[0])
    .gte('end_date', startOfMonth.split('T')[0])

  let leavesTakenThisMonth = 0
  for (const l of (leaves || [])) {
    const start = new Date(l.start_date)
    const end = new Date(l.end_date)
    const current = new Date(start)
    while (current <= end) {
      if (current.getMonth() + 1 === currMonth && current.getFullYear() === currYear) {
        leavesTakenThisMonth++
      }
      current.setDate(current.getDate() + 1)
    }
  }

  // 3. Leave Balances Summary
  const { data: balances } = await supabase
    .from('leave_balances')
    .select('total_days, used_days, leave_type:leave_types(name)')
    .eq('employee_id', employeeId)

  // 4. Latest Payslip Summary
  const { data: latestPayslip } = await supabase
    .from('payroll_line_items')
    .select('net_pay, payroll_run:payroll_runs(month, year, status)')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let latestPayslipData = null
  if (latestPayslip && (latestPayslip.payroll_run as unknown as { status: string })?.status === 'finalized') {
    latestPayslipData = {
      net_pay: latestPayslip.net_pay,
      month: (latestPayslip.payroll_run as unknown as { month: number }).month,
      year: (latestPayslip.payroll_run as unknown as { year: number }).year
    }
  }

  return {
    attendance: {
      presentDays,
      leavesTakenThisMonth
    },
    balances: balances?.map(b => ({
      name: (b.leave_type as unknown as { name: string })?.name,
      available: b.total_days - b.used_days
    })) || [],
    latestPayslip: latestPayslipData
  }
}
