import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(
  req: Request,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token
    const supabase = createServiceClient()

    // Verify token exists and is active
    const { data: device, error } = await supabase
      .from('device_registrations')
      .select('id, is_active')
      .eq('device_token', token)
      .eq('is_active', true)
      .single()

    if (error || !device) {
      return NextResponse.json({ error: 'Invalid device token' }, { status: 404 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Standard OwnTracks configuration JSON
    const config = {
      _type: 'configuration',
      mode: 3, // HTTP Mode
      url: `${appUrl}/api/location-ping?token=${token}`,
      username: token,
      locatorInterval: 60,       // Ping every 60 seconds
      locatorDisplacement: 20,   // Or every 20 meters
      monitoring: 1,             // Significant changes mode
      cmd: false,
      pubTopicBase: '',
      sub: false
    }

    return NextResponse.json(config)
  } catch (err) {
    console.error('Error generating device config:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
