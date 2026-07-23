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
    { data: todayLogs },
    { data: allEmployees }
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
      .select('id, type, timestamp, status, override_reason, distance_from_outlet_meters, employee:employees!attendance_logs_employee_id_fkey!inner(id, full_name, role, org_id, outlet:outlets(name))')
      .eq('employee.org_id', orgId)
      .gte('timestamp', startOfDay)
      .order('timestamp', { ascending: true }),
    supabase
      .from('employees')
      .select('id, full_name, role, outlet:outlets(name)')
      .eq('org_id', orgId)
      .eq('status', 'active')
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

  // Detailed Live Roster & Worked Hours per Employee
  type TypedLog = {
    id: string
    type: 'check_in' | 'check_out'
    timestamp: string
    status: string
    override_reason: string | null
    distance_from_outlet_meters: number
    employee?: {
      id: string
      full_name: string
      role: string
      outlet?: { name: string }
    }
  }

  const logs = (todayLogs || []) as unknown as TypedLog[]
  const employeesList = (allEmployees || []) as unknown as { id: string; full_name: string; role: string; outlet?: { name: string } }[]

  const liveRoster = employeesList.map((emp) => {
    const empLogs = logs.filter((l) => l.employee?.id === emp.id)
    const firstCheckIn = empLogs.find((l) => l.type === 'check_in')
    const lastLog = empLogs.length > 0 ? empLogs[empLogs.length - 1] : null

    let currentStatus: 'WORKING' | 'ON_BREAK' | 'SHIFT_ENDED' | 'NOT_STARTED' = 'NOT_STARTED'
    let clockInTime: string | null = null
    let clockOutTime: string | null = null

    if (firstCheckIn) {
      clockInTime = new Date(firstCheckIn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }

    if (!lastLog) {
      currentStatus = 'NOT_STARTED'
      clockOutTime = '--:--'
    } else if (lastLog.type === 'check_in') {
      currentStatus = 'WORKING'
      clockOutTime = 'In Progress'
    } else {
      if (lastLog.override_reason === 'FINAL_SHIFT_END') {
        currentStatus = 'SHIFT_ENDED'
        clockOutTime = new Date(lastLog.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      } else {
        currentStatus = 'ON_BREAK'
        clockOutTime = 'On Break'
      }
    }

    // Active Worked & Break Ms
    let workedMs = 0
    let breakMs = 0
    let lastInTime: number | null = null
    let lastBreakTime: number | null = null

    for (const l of empLogs) {
      const t = new Date(l.timestamp).getTime()
      if (l.type === 'check_in') {
        if (lastBreakTime !== null) {
          breakMs += t - lastBreakTime
          lastBreakTime = null
        }
        lastInTime = t
      } else if (l.type === 'check_out') {
        if (lastInTime !== null) {
          workedMs += t - lastInTime
          lastInTime = null
        }
        if (l.override_reason !== 'FINAL_SHIFT_END') {
          lastBreakTime = t
        }
      }
    }

    const now = Date.now()
    if (lastInTime !== null) {
      workedMs += now - lastInTime
    }
    if (lastBreakTime !== null) {
      breakMs += now - lastBreakTime
    }

    const workedHoursStr = workedMs > 0 ? `${Math.floor(workedMs / 3600000)}h ${Math.floor((workedMs % 3600000) / 60000)}m` : '0h 0m'
    const breakTimeStr = breakMs > 0 ? `${Math.floor(breakMs / 3600000)}h ${Math.floor((breakMs % 3600000) / 60000)}m` : '0h 0m'

    return {
      id: emp.id,
      name: emp.full_name,
      role: emp.role,
      outletName: emp.outlet?.name || 'Unassigned',
      clockInTime: clockInTime || '--:--',
      clockOutTime: clockOutTime || '--:--',
      currentStatus,
      hoursWorkedStr: workedHoursStr,
      breakTimeStr,
      hasFlags: empLogs.some((l) => l.status === 'flagged'),
      lastLogTime: lastLog?.timestamp || null,
      distanceMeters: lastLog?.distance_from_outlet_meters ?? null,
    }
  }).sort((a, b) => {
    const priority = { WORKING: 0, ON_BREAK: 1, SHIFT_ENDED: 2, NOT_STARTED: 3 }
    return priority[a.currentStatus] - priority[b.currentStatus]
  })

  // Real-time Activity Feed Logs Stream (Last 12 events)
  const activityFeed = [...logs].reverse().slice(0, 12).map((l) => {
    let label = 'Clocked In'
    if (l.type === 'check_in' && l.override_reason === 'AUTO_GEOFENCE_RESUME') label = 'Resumed Shift (Returned in Range)'
    else if (l.type === 'check_out' && l.override_reason === 'FINAL_SHIFT_END') label = 'Ended Shift for Today'
    else if (l.type === 'check_out' && l.override_reason === 'AUTO_GEOFENCE_BREAK') label = 'Auto Break (Stepped Out of Range)'
    else if (l.type === 'check_out') label = 'Clocked Out'

    return {
      id: l.id,
      employeeName: l.employee?.full_name || 'Staff',
      role: l.employee?.role || 'staff',
      outletName: l.employee?.outlet?.name || 'Outlet',
      type: l.type,
      label,
      timestamp: l.timestamp,
      distanceMeters: l.distance_from_outlet_meters,
      status: l.status,
    }
  })

  // Summary status counts for dashboard summary card
  const statusCounts = {
    working: liveRoster.filter((e) => e.currentStatus === 'WORKING').length,
    onBreak: liveRoster.filter((e) => e.currentStatus === 'ON_BREAK').length,
    shiftEnded: liveRoster.filter((e) => e.currentStatus === 'SHIFT_ENDED').length,
    notStarted: liveRoster.filter((e) => e.currentStatus === 'NOT_STARTED').length,
  }

  return {
    metrics: {
      outletCount: outletCount || 0,
      employeeCount: employeeCount || 0,
      attendancePercentage,
      pendingLeaves: pendingLeaves || 0,
      payrollCost,
      statusCounts,
    },
    outletBreakdown,
    liveRoster,
    activityFeed,
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

  type TypedLog = {
    id: string
    employee_id: string
    type: 'check_in' | 'check_out'
    timestamp: string
    status: string
    override_reason?: string | null
  }

  const logs = (todayLogs || []) as unknown as TypedLog[]
  let presentCount = 0

  const roster = employees?.map((emp) => {
    const empLogs = logs.filter((l) => l.employee_id === emp.id)
    const firstCheckIn = empLogs.find((l) => l.type === 'check_in')
    const lastLog = empLogs.length > 0 ? empLogs[empLogs.length - 1] : null

    let currentStatus: 'WORKING' | 'ON_BREAK' | 'SHIFT_ENDED' | 'NOT_STARTED' = 'NOT_STARTED'
    let clockInTime: string | null = null
    let clockOutTime: string | null = null

    if (firstCheckIn) {
      clockInTime = new Date(firstCheckIn.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    }

    if (!lastLog) {
      currentStatus = 'NOT_STARTED'
      clockOutTime = '--:--'
    } else if (lastLog.type === 'check_in') {
      currentStatus = 'WORKING'
      clockOutTime = 'In Progress'
      presentCount++
    } else {
      presentCount++
      if (lastLog.override_reason === 'FINAL_SHIFT_END') {
        currentStatus = 'SHIFT_ENDED'
        clockOutTime = new Date(lastLog.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
      } else {
        currentStatus = 'ON_BREAK'
        clockOutTime = 'On Break'
      }
    }

    // Active Worked & Break Ms
    let workedMs = 0
    let breakMs = 0
    let lastInTime: number | null = null
    let lastBreakTime: number | null = null

    for (const l of empLogs) {
      const t = new Date(l.timestamp).getTime()
      if (l.type === 'check_in') {
        if (lastBreakTime !== null) {
          breakMs += t - lastBreakTime
          lastBreakTime = null
        }
        lastInTime = t
      } else if (l.type === 'check_out') {
        if (lastInTime !== null) {
          workedMs += t - lastInTime
          lastInTime = null
        }
        if (l.override_reason !== 'FINAL_SHIFT_END') {
          lastBreakTime = t
        }
      }
    }

    const now = Date.now()
    if (lastInTime !== null) workedMs += now - lastInTime
    if (lastBreakTime !== null) breakMs += now - lastBreakTime

    const workedHoursStr = workedMs > 0 ? `${Math.floor(workedMs / 3600000)}h ${Math.floor((workedMs % 3600000) / 60000)}m` : '0h 0m'
    const breakTimeStr = breakMs > 0 ? `${Math.floor(breakMs / 3600000)}h ${Math.floor((breakMs % 3600000) / 60000)}m` : '0h 0m'

    return {
      id: emp.id,
      name: emp.full_name,
      role: emp.role,
      clockInTime: clockInTime || '--:--',
      clockOutTime: clockOutTime || '--:--',
      currentStatus,
      hoursWorkedStr: workedHoursStr,
      breakTimeStr,
      lastLogTime: lastLog?.timestamp || null,
      flagged: empLogs.some((l) => l.status === 'flagged'),
    }
  }) || []

  return {
    metrics: {
      staffCount: staffCount || 0,
      presentCount,
      pendingLeaves: pendingLeaves || 0,
    },
    roster,
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
