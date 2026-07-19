'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAdminDashboardStats(orgId: string) {
  const supabase = await createClient()

  const todayDateStr = new Date().toISOString().split('T')[0]
  const startOfDay = new Date(todayDateStr).toISOString()
  const currMonth = new Date().getMonth() + 1
  const currYear = new Date().getFullYear()

  // Run independent queries in parallel to drastically improve page loading speed
  const [
    { count: outletCount },
    { count: employeeCount },
    { data: checkinsToday },
    { count: pendingLeaves },
    { data: currPayroll },
    { data: outletsStatsData },
    { data: todayLogs }
  ] = await Promise.all([
    supabase.from('outlets').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase
      .from('attendance_logs')
      .select('employee_id, employee:employees!attendance_logs_employee_id_fkey!inner(org_id)')
      .eq('employee.org_id', orgId)
      .eq('type', 'check_in')
      .gte('timestamp', startOfDay),
    supabase
      .from('leave_requests')
      .select('*, employee:employees!leave_requests_employee_id_fkey!inner(org_id)', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('employee.org_id', orgId),
    supabase
      .from('payroll_runs')
      .select('id, payroll_line_items(net_pay)')
      .eq('org_id', orgId)
      .eq('month', currMonth)
      .eq('year', currYear)
      .maybeSingle(),
    supabase
      .from('outlets')
      .select('id, name, employees(id)')
      .eq('org_id', orgId),
    supabase
      .from('attendance_logs')
      .select('id, type, timestamp, status, employee:employees!attendance_logs_employee_id_fkey!inner(id, full_name, role, org_id)')
      .eq('employee.org_id', orgId)
      .gte('timestamp', startOfDay)
      .order('timestamp', { ascending: true })
  ])

  // Calculate unique present employees count today
  const uniquePresent = new Set(checkinsToday?.map(l => l.employee_id)).size
  const attendancePercentage = employeeCount ? Math.round((uniquePresent / employeeCount) * 100) : 0

  // Calculate current payroll cost
  let payrollCost = 0
  if (currPayroll && currPayroll.payroll_line_items) {
    const lineItems = currPayroll.payroll_line_items as unknown as { net_pay: number }[]
    payrollCost = lineItems.reduce((acc, curr) => acc + Number(curr.net_pay), 0) || 0
  }

  // Per-outlet breakdown
  const outletBreakdown = outletsStatsData?.map(o => {
    const empCount = o.employees?.length || 0
    // checkinsToday has employee_id. Filter by whether employee belongs to this outlet
    const presentCount = checkinsToday?.filter(l => 
      (o.employees as unknown as { id: string }[])?.some(e => e.id === l.employee_id)
    )?.length || 0
    
    return {
      id: o.id,
      name: o.name,
      employeeCount: empCount,
      attendancePercentage: empCount ? Math.round((presentCount / empCount) * 100) : 0
    }
  }) || []

  // Generate Live Roster from today's logs
  type LiveRosterEmployee = {
    id: string
    name: string
    role: string
    status: string
    lastLogTime: string
  }
  const liveRosterMap = new Map<string, LiveRosterEmployee>()
  todayLogs?.forEach(log => {
    const emp = log.employee as unknown as { id: string, full_name: string, role: string }
    liveRosterMap.set(emp.id, {
      id: emp.id,
      name: emp.full_name,
      role: emp.role,
      status: log.type === 'check_in' ? 'checked_in' : 'checked_out',
      lastLogTime: log.timestamp
    })
  })
  
  // Sort by most recent activity
  const liveRoster = Array.from(liveRosterMap.values())
    .sort((a, b) => new Date(b.lastLogTime).getTime() - new Date(a.lastLogTime).getTime())

  return {
    metrics: {
      outletCount: outletCount || 0,
      employeeCount: employeeCount || 0,
      attendancePercentage,
      pendingLeaves: pendingLeaves || 0,
      payrollCost
    },
    outletBreakdown,
    liveRoster
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

  const todayDateStr = new Date().toISOString().split('T')[0]
  const startOfDay = new Date(todayDateStr).toISOString()

  // Run manager counts and logs in parallel
  const [
    { count: staffCount },
    { count: pendingLeaves },
    { data: employees },
    { data: todayLogs }
  ] = await Promise.all([
    supabase
      .from('employees')
      .select('*', { count: 'exact', head: true })
      .eq('outlet_id', outletId)
      .eq('status', 'active'),
    supabase
      .from('leave_requests')
      .select('*, employee:employees!leave_requests_employee_id_fkey!inner(outlet_id)', { count: 'exact', head: true })
      .eq('status', 'pending')
      .eq('employee.outlet_id', outletId),
    supabase
      .from('employees')
      .select('id, full_name, role')
      .eq('outlet_id', outletId)
      .eq('status', 'active'),
    supabase
      .from('attendance_logs')
      .select('employee_id, type, timestamp, status')
      .eq('outlet_id', outletId)
      .gte('timestamp', startOfDay)
      .order('timestamp', { ascending: true })
  ])

  let presentCount = 0
  const roster = employees?.map(emp => {
    const empLogs = todayLogs?.filter(l => l.employee_id === emp.id) || []
    
    let currentStatus: 'checked_in' | 'checked_out' | 'absent' = 'absent'
    let lastLogTime = null
    
    if (empLogs.length > 0) {
      const lastLog = empLogs[empLogs.length - 1]
      if (lastLog.type === 'check_in') {
        currentStatus = 'checked_in'
        presentCount++
      } else {
        currentStatus = 'checked_out'
        presentCount++
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

  const startOfMonth = new Date(currYear, currMonth - 1, 1).toISOString()
  const endOfMonth = new Date(currYear, currMonth, 0, 23, 59, 59).toISOString()

  // Run all staff dashboard queries in parallel
  const [
    { data: logs },
    { data: leaves },
    { data: balances },
    { data: latestPayslip }
  ] = await Promise.all([
    supabase
      .from('attendance_logs')
      .select('type, timestamp')
      .eq('employee_id', employeeId)
      .gte('timestamp', startOfMonth)
      .lte('timestamp', endOfMonth),
    supabase
      .from('leave_requests')
      .select('start_date, end_date')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .lte('start_date', endOfMonth.split('T')[0])
      .gte('end_date', startOfMonth.split('T')[0]),
    supabase
      .from('leave_balances')
      .select('total_days, used_days, leave_type:leave_types(name)')
      .eq('employee_id', employeeId),
    supabase
      .from('payroll_line_items')
      .select('net_pay, payroll_run:payroll_runs(month, year, status)')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle() // Use maybeSingle to prevent database errors when no payslips exist yet
  ])

  const presentDays = new Set((logs || []).filter(l => l.type === 'check_in').map(l => l.timestamp.split('T')[0])).size

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
