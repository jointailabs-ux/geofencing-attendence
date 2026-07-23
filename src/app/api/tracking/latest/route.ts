import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { getISTStartOfDay, getISTEndOfDay } from '@/lib/utils'
import { autoCheckOutOfflineEmployees } from '@/app/actions/tracking'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify caller is admin/manager
    const { data: caller } = await supabase
      .from('employees')
      .select('role, org_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!caller || !['super_admin', 'manager'].includes(caller.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const serviceClient = createServiceClient()

    // Run offline check to auto-checkout employees who turned off GPS/phone
    try {
      await autoCheckOutOfflineEmployees()
    } catch (err) {
      console.error('Error in offline check:', err)
    }

    // Get all active employees in org
    const { data: employees } = await serviceClient
      .from('employees')
      .select('id, full_name, role, outlet_id, outlets(name, latitude, longitude, radius_meters)')
      .eq('org_id', caller.org_id)
      .eq('status', 'active')

    if (!employees || employees.length === 0) {
      return NextResponse.json({ data: [] })
    }

    const start = getISTStartOfDay().toISOString()
    const end = getISTEndOfDay().toISOString()

    // Get last ping for each employee only if they are clocked in today
    const results = await Promise.all(
      employees.map(async (emp) => {
        // Verify if employee is currently clocked in today
        const { data: logs } = await serviceClient
          .from('attendance_logs')
          .select('type')
          .eq('employee_id', emp.id)
          .gte('timestamp', start)
          .lte('timestamp', end)
          .order('timestamp', { ascending: false })
          .limit(1)

        const isClockedIn = logs && logs.length > 0 && logs[0].type === 'check_in'

        if (!isClockedIn) {
          return {
            employee: emp,
            lastPing: null,
          }
        }

        const { data: pings } = await serviceClient
          .from('location_pings')
          .select('latitude, longitude, accuracy, battery, connection_type, velocity, is_inside_geofence, distance_from_outlet, created_at')
          .eq('employee_id', emp.id)
          .order('created_at', { ascending: false })
          .limit(1)

        return {
          employee: emp,
          lastPing: pings?.[0] || null,
        }
      })
    )

    return NextResponse.json({ data: results })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
