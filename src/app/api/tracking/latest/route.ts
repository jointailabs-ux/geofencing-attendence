import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

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

    // Get all active employees in org
    const { data: employees } = await serviceClient
      .from('employees')
      .select('id, full_name, role, outlet_id, outlets(name, latitude, longitude, radius_meters)')
      .eq('org_id', caller.org_id)
      .eq('status', 'active')

    if (!employees || employees.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Get last ping for each employee
    const results = await Promise.all(
      employees.map(async (emp) => {
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
