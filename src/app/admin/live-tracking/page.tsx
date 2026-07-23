import { getCachedEmployee } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getLatestPingsForOrg, getOutletsForMap } from '@/app/actions/tracking'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Radio, Satellite, Smartphone } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Live Tracking — GeoAttend Admin' }

// Leaflet must be loaded client-side only
const LiveTrackingMap = dynamic(
  () => import('@/components/tracking/LiveTrackingMap').then(mod => ({ default: mod.LiveTrackingMap })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center animate-pulse">
        <Satellite className="w-12 h-12 mx-auto text-violet-400/30 mb-3" />
        <p className="text-sm text-slate-400">Loading live map…</p>
      </div>
    ),
  }
)

export default async function LiveTrackingPage() {
  const employee = await getCachedEmployee()
  if (!employee || !['super_admin', 'manager'].includes(employee.role)) redirect('/login')

  const [pingData, outlets] = await Promise.all([
    getLatestPingsForOrg(employee.org_id),
    getOutletsForMap(employee.org_id),
  ])

  return (
    <div className="animate-fade-in space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live GPS Tracking
          </div>
          <h1 className="page-title text-3xl font-extrabold text-white">Live Employee Tracking</h1>
          <p className="page-subtitle text-xs sm:text-sm text-slate-400 mt-1">
            Real-time GPS locations powered by OwnTracks. Map auto-refreshes every 30 seconds.
          </p>
        </div>
        <Link
          href="/admin/devices"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-600/15"
        >
          <Smartphone className="w-4 h-4" />
          Manage Devices / Tokens
        </Link>
      </div>

      <LiveTrackingMap
        initialData={pingData as never[]}
        outlets={outlets}
        orgId={employee.org_id}
      />
    </div>
  )
}
