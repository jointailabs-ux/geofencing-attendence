import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMyDeviceStatus } from '@/app/actions/tracking'
import { CheckCircle2, Radio, Download, Settings, ArrowRight, Wifi } from 'lucide-react'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Setup Tracking - GeoAttend' }

export default async function SetupTrackingPage() {
  const employee = await getCachedEmployee()
  if (!employee) redirect('/login')

  const status = await getMyDeviceStatus()
  const hasDevice = status?.device != null
  const isReceivingPings = status?.lastPing != null
  const lastPingTime = status?.lastPing?.created_at
    ? new Date(status.lastPing.created_at).toLocaleString('en-IN')
    : null

  // Webhook URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  const webhookUrl = hasDevice ? `${appUrl}/api/location-ping?token=${status.device.device_token}` : null

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="page-header">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2">
          <Radio className="w-3.5 h-3.5" /> Location Tracking Setup
        </div>
        <h1 className="page-title text-3xl font-extrabold text-white">Setup OwnTracks</h1>
        <p className="page-subtitle text-xs sm:text-sm text-slate-400 mt-1">
          Enable automatic location tracking for accurate attendance — even when your phone is locked.
        </p>
      </div>

      {/* Connection Status */}
      <div className={`rounded-2xl border p-5 ${
        isReceivingPings
          ? 'border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-cyan-500/5'
          : hasDevice
            ? 'border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5'
            : 'border-slate-500/20 bg-white/[0.02]'
      }`}>
        <div className="flex items-center gap-3 mb-2">
          {isReceivingPings ? (
            <>
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-sm font-semibold text-emerald-400">Connected & Sending Data</h3>
            </>
          ) : hasDevice ? (
            <>
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <h3 className="text-sm font-semibold text-amber-400">Device Registered — Waiting for First Ping</h3>
            </>
          ) : (
            <>
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <h3 className="text-sm font-semibold text-slate-400">Not Set Up Yet</h3>
            </>
          )}
        </div>
        {lastPingTime && (
          <p className="text-xs text-slate-400">
            Last location received: <strong className="text-white">{lastPingTime}</strong>
            {status?.lastPing?.battery != null && (
              <> • Battery: <strong className="text-white">{status.lastPing.battery}%</strong></>
            )}
            {status?.lastPing?.is_inside_geofence != null && (
              <> • {status.lastPing.is_inside_geofence
                ? <span className="text-emerald-400">Inside geofence ✓</span>
                : <span className="text-red-400">Outside geofence</span>
              }</>
            )}
          </p>
        )}
        {!hasDevice && (
          <p className="text-xs text-slate-500 mt-1">
            Ask your admin to generate a device token for you. Once set up, your location will be tracked automatically.
          </p>
        )}
      </div>

      {/* Setup Steps */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Setup Instructions</h3>
        </div>
        <div className="divide-y divide-white/5">
          {/* Step 1 */}
          <div className="p-4 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              1
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                <Download className="w-4 h-4 text-cyan-400" /> Install OwnTracks
              </h4>
              <p className="text-xs text-slate-400">
                Download <strong className="text-emerald-400">OwnTracks</strong> from the{' '}
                <a href="https://play.google.com/store/apps/details?id=org.owntracks.android" target="_blank" rel="noopener noreferrer"
                  className="text-cyan-400 underline underline-offset-2">Google Play Store</a>{' '}
                or{' '}
                <a href="https://apps.apple.com/app/owntracks/id692424691" target="_blank" rel="noopener noreferrer"
                  className="text-cyan-400 underline underline-offset-2">Apple App Store</a>.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">It&apos;s free and open-source.</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-slate-600 flex-shrink-0 mt-1" />
          </div>

          {/* Step 2 */}
          <div className="p-4 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              2
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-400" /> Configure Connection
              </h4>
              <p className="text-xs text-slate-400 mb-2">
                Open OwnTracks → tap the <strong className="text-white">☰ menu</strong> → <strong className="text-white">Preferences</strong> → <strong className="text-white">Connection</strong>
              </p>
              <div className="space-y-1.5 text-xs text-slate-400 bg-slate-800/50 rounded-xl p-3">
                <p><strong className="text-white">Mode:</strong> <span className="text-emerald-400">HTTP</span></p>
                <p><strong className="text-white">URL:</strong>{' '}
                  {webhookUrl ? (
                    <code className="text-cyan-400 break-all">{webhookUrl}</code>
                  ) : (
                    <span className="text-slate-500">Ask admin for your webhook URL</span>
                  )}
                </p>
                <p><strong className="text-white">Username:</strong>{' '}
                  {hasDevice ? (
                    <code className="text-emerald-400">{status.device.device_token}</code>
                  ) : (
                    <span className="text-slate-500">Ask admin for your token</span>
                  )}
                </p>
                <p><strong className="text-white">Password:</strong> <span className="text-slate-500">(leave empty)</span></p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-4 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              3
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" /> Grant Permissions
              </h4>
              <p className="text-xs text-slate-400">
                When prompted, grant OwnTracks <strong className="text-white">&quot;Allow all the time&quot;</strong> location permission.
                This enables tracking even when the app is in the background or your phone is locked.
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                Android: Settings → Apps → OwnTracks → Permissions → Location → &quot;Allow all the time&quot;
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-4 flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              ✓
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white mb-1 flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-emerald-400" /> Done!
              </h4>
              <p className="text-xs text-slate-400">
                OwnTracks will now silently send your location every ~60 seconds.
                Your status card above will turn <strong className="text-emerald-400">green</strong> once data is flowing.
                Battery usage is minimal (~2-3% per day).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
