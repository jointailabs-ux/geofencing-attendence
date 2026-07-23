import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { calculateDistance, getISTStartOfDay, getISTEndOfDay } from '@/lib/utils'

// OwnTracks sends: { _type: "location", tid, tst, lat, lon, acc, batt, vel, alt, conn }
interface OwnTracksPayload {
  _type: string
  tid?: string      // Tracker ID (2-char device ID)
  tst?: number      // Unix timestamp
  lat?: number      // Latitude
  lon?: number      // Longitude
  acc?: number      // Accuracy in meters
  batt?: number     // Battery percentage
  vel?: number      // Velocity km/h
  alt?: number      // Altitude meters
  conn?: string     // Connection type: w=wifi, m=mobile
}

// Auto-break threshold: if outside geofence for this many seconds
const AUTO_BREAK_THRESHOLD_SECONDS = 300 // 5 minutes

export async function POST(req: Request) {
  try {
    const supabase = createServiceClient()

    // 1. Parse OwnTracks payload
    const body: OwnTracksPayload = await req.json()

    // Ignore non-location messages
    if (body._type !== 'location' || !body.lat || !body.lon) {
      return NextResponse.json({ status: 'ignored', reason: 'not a location message' })
    }

    // 2. Authenticate via HTTP Basic Auth header (username = device_token)
    const authHeader = req.headers.get('authorization')
    let deviceToken = ''

    if (authHeader && authHeader.startsWith('Basic ')) {
      const decoded = atob(authHeader.substring(6))
      deviceToken = decoded.split(':')[0] // username is the token
    }

    // Also check X-Device-Token header as fallback
    if (!deviceToken) {
      deviceToken = req.headers.get('x-device-token') || ''
    }

    // Also check query param as last fallback
    if (!deviceToken) {
      const url = new URL(req.url)
      deviceToken = url.searchParams.get('token') || ''
    }

    if (!deviceToken) {
      return NextResponse.json({ error: 'Missing device token. Configure OwnTracks username as your device token.' }, { status: 401 })
    }

    // 3. Look up device registration
    const { data: device, error: deviceErr } = await supabase
      .from('device_registrations')
      .select('id, employee_id, is_active')
      .eq('device_token', deviceToken)
      .eq('is_active', true)
      .single()

    if (deviceErr || !device) {
      return NextResponse.json({ error: 'Unknown or inactive device token.' }, { status: 401 })
    }

    // Update last_seen_at
    await supabase
      .from('device_registrations')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', device.id)

    // 4. Get employee's assigned outlet for geofence check
    const { data: employee } = await supabase
      .from('employees')
      .select('id, outlet_id, status, outlets(id, latitude, longitude, radius_meters, buffer_meters)')
      .eq('id', device.employee_id)
      .single()

    if (!employee || employee.status !== 'active') {
      return NextResponse.json({ error: 'Employee not found or inactive.' }, { status: 404 })
    }

    // 5. Geofence check
    let isInsideGeofence = false
    let nearestOutletId: string | null = null
    let distanceFromOutlet: number | null = null

    if (employee.outlet_id && employee.outlets) {
      const outlet = employee.outlets as unknown as {
        id: string
        latitude: number
        longitude: number
        radius_meters: number
        buffer_meters: number
      }

      distanceFromOutlet = Math.round(
        calculateDistance(body.lat, body.lon, outlet.latitude, outlet.longitude)
      )
      isInsideGeofence = distanceFromOutlet <= (outlet.radius_meters + outlet.buffer_meters)
      nearestOutletId = outlet.id
    }

    // 6. Store the ping
    await supabase.from('location_pings').insert({
      employee_id: device.employee_id,
      latitude: body.lat,
      longitude: body.lon,
      accuracy: body.acc || null,
      battery: body.batt || null,
      connection_type: body.conn || null,
      velocity: body.vel || null,
      altitude: body.alt || null,
      is_inside_geofence: isInsideGeofence,
      nearest_outlet_id: nearestOutletId,
      distance_from_outlet: distanceFromOutlet,
      raw_payload: body,
    })

    // 7. Auto break/resume detection
    if (employee.outlet_id) {
      const start = getISTStartOfDay().toISOString()
      const end = getISTEndOfDay().toISOString()

      // Get today's last attendance log
      const { data: lastLogs } = await supabase
        .from('attendance_logs')
        .select('id, type, timestamp')
        .eq('employee_id', device.employee_id)
        .gte('timestamp', start)
        .lte('timestamp', end)
        .order('timestamp', { ascending: false })
        .limit(1)

      const lastLog = lastLogs?.[0]

      if (lastLog) {
        // Employee is checked in and just left geofence → auto-break
        if (lastLog.type === 'check_in' && !isInsideGeofence) {
          // Check if they've been outside for AUTO_BREAK_THRESHOLD_SECONDS
          const { data: recentPings } = await supabase
            .from('location_pings')
            .select('is_inside_geofence, created_at')
            .eq('employee_id', device.employee_id)
            .gte('created_at', new Date(Date.now() - AUTO_BREAK_THRESHOLD_SECONDS * 1000).toISOString())
            .order('created_at', { ascending: false })
            .limit(5)

          const allOutside = recentPings && recentPings.length >= 3 &&
            recentPings.every(p => !p.is_inside_geofence)

          if (allOutside && employee.outlet_id) {
            // Insert auto-break checkout
            await supabase.from('attendance_logs').insert({
              employee_id: device.employee_id,
              outlet_id: employee.outlet_id,
              type: 'check_out',
              submitted_lat: body.lat,
              submitted_lng: body.lon,
              gps_accuracy_meters: body.acc || 0,
              distance_from_outlet_meters: distanceFromOutlet || 0,
              status: 'valid',
              override_reason: 'AUTO_OWNTRACKS_BREAK_DETECTED',
            })
          }
        }

        // Employee was on break and just re-entered geofence → auto-resume
        if (lastLog.type === 'check_out' && isInsideGeofence) {
          const lastCheckoutReason = lastLog.type === 'check_out' ? 'break' : null
          if (lastCheckoutReason && employee.outlet_id) {
            await supabase.from('attendance_logs').insert({
              employee_id: device.employee_id,
              outlet_id: employee.outlet_id,
              type: 'check_in',
              submitted_lat: body.lat,
              submitted_lng: body.lon,
              gps_accuracy_meters: body.acc || 0,
              distance_from_outlet_meters: distanceFromOutlet || 0,
              status: 'valid',
              override_reason: 'AUTO_OWNTRACKS_RESUME_DETECTED',
            })
          }
        }
      }
    }

    return NextResponse.json({
      status: 'ok',
      inside_geofence: isInsideGeofence,
      distance: distanceFromOutlet,
    })
  } catch (err) {
    console.error('Location ping error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// OwnTracks also sends GET requests for configuration — respond with empty
export async function GET() {
  return NextResponse.json({ status: 'GeoAttend OwnTracks Endpoint Active' })
}
