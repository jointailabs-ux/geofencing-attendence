import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateDistance } from '@/lib/utils'
import { z } from 'zod'

const checkinSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  accuracy: z.number(),
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user securely
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse payload
    const body = await req.json()
    const result = checkinSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    const { latitude, longitude, accuracy } = result.data

    // 3. Get employee and outlet details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('id, outlet_id, role, outlets ( latitude, longitude, radius_meters, buffer_meters )')
      .eq('auth_user_id', authData.user.id)
      .single()

    if (empError || !employee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 })
    }

    if (employee.role !== 'staff') {
      return NextResponse.json({ error: 'Only staff can check in' }, { status: 403 })
    }

    if (!employee.outlet_id || !employee.outlets) {
      return NextResponse.json({ error: 'No outlet assigned' }, { status: 400 })
    }

    // Types workaround for supabase joined arrays
    const outlet = employee.outlets as unknown as {
      latitude: number
      longitude: number
      radius_meters: number
      buffer_meters: number
    }

    // 4. Ensure no duplicate check-in today (without a checkout)
    const todayStr = new Date().toISOString().split('T')[0]
    
    const { data: lastLogs, error: logsError } = await supabase
      .from('attendance_logs')
      .select('type')
      .eq('employee_id', employee.id)
      .gte('timestamp', `${todayStr}T00:00:00.000Z`)
      .order('timestamp', { ascending: false })
      .limit(1)

    if (logsError) {
      return NextResponse.json({ error: 'Failed to verify previous logs' }, { status: 500 })
    }

    if (lastLogs && lastLogs.length > 0 && lastLogs[0].type === 'check_in') {
      return NextResponse.json({ error: 'Already checked in. Please check out first.' }, { status: 400 })
    }

    // 5. Calculate Haversine distance
    const distance = Math.round(
      calculateDistance(latitude, longitude, outlet.latitude, outlet.longitude)
    )

    // 6. Determine status
    const isWithinGeofence = distance <= outlet.radius_meters + outlet.buffer_meters
    const status = isWithinGeofence ? 'valid' : 'flagged'

    // 7. Insert the log
    const { data: insertData, error: insertError } = await supabase
      .from('attendance_logs')
      .insert({
        employee_id: employee.id,
        outlet_id: employee.outlet_id,
        type: 'check_in',
        submitted_lat: latitude,
        submitted_lng: longitude,
        gps_accuracy_meters: Math.round(accuracy),
        distance_from_outlet_meters: distance,
        status: status,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to record check-in' }, { status: 500 })
    }

    // 8. Return response to UI
    return NextResponse.json({
      success: true,
      log: insertData,
      distance,
      isWithinGeofence,
    })
  } catch (error) {
    console.error('Check-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
