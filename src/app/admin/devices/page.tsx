import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getDeviceRegistrations } from '@/app/actions/tracking'
import { createServiceClient } from '@/lib/supabase/server'
import { DeviceRegistrationTable } from '@/components/tracking/DeviceRegistrationTable'
import { Smartphone, Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Device Management — GeoAttend Admin' }

export default async function DevicesPage() {
  const employee = await getCachedEmployee()
  if (!employee || !['super_admin', 'manager'].includes(employee.role)) redirect('/login')

  const serviceClient = createServiceClient()

  // Get all devices
  const devices = await getDeviceRegistrations(employee.org_id)

  // Get all employees for "unregistered" list
  const { data: allEmployees } = await serviceClient
    .from('employees')
    .select('id, full_name, role, email, employee_code')
    .eq('org_id', employee.org_id)
    .eq('status', 'active')
    .order('full_name')

  // App URL for webhook configuration
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="page-header">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
          <Shield className="w-3.5 h-3.5" /> OwnTracks Device Management
        </div>
        <h1 className="page-title text-3xl font-extrabold text-white">Tracking Devices</h1>
        <p className="page-subtitle text-xs sm:text-sm text-slate-400 mt-1">
          Generate device tokens for employees to configure OwnTracks for background GPS tracking.
        </p>
      </div>

      {/* Setup Instructions for Admin */}
      <div className="rounded-2xl border border-violet-500/15 bg-gradient-to-br from-violet-500/5 to-cyan-500/5 p-5">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-3">
          <Smartphone className="w-4 h-4 text-violet-400" /> Quick Setup Guide
        </h3>
        <ol className="space-y-2 text-xs text-slate-400 list-decimal list-inside">
          <li><strong className="text-white">Generate a token</strong> for each employee below.</li>
          <li>Ask the employee to install <strong className="text-emerald-400">OwnTracks</strong> from Play Store / App Store.</li>
          <li>In OwnTracks → Settings → Connection → <strong className="text-white">Mode: HTTP</strong></li>
          <li>Set <strong className="text-white">URL</strong> to the <em>Webhook URL</em> (click &quot;Copy Webhook URL&quot; below).</li>
          <li>Set <strong className="text-white">Username</strong> to the device token, leave password blank.</li>
          <li>Done! Location pings will appear on the <strong className="text-cyan-400">Live Tracking</strong> page.</li>
        </ol>
      </div>

      <DeviceRegistrationTable
        devices={devices as never[]}
        allEmployees={allEmployees || []}
        appUrl={appUrl}
      />
    </div>
  )
}
