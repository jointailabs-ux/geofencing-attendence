import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OutletTable } from '@/components/outlets/OutletTable'
import { Building2, Plus, MapPin } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Outlets' }

export default async function OutletsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: employee } = await supabase
    .from('employees')
    .select('org_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee) redirect('/login')

  // Fetch outlets and active employees in parallel, then group counts in-memory to prevent sequential database queries
  const [
    { data: outlets },
    { data: activeEmployees }
  ] = await Promise.all([
    supabase
      .from('outlets')
      .select('*')
      .eq('org_id', employee.org_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('employees')
      .select('outlet_id')
      .eq('org_id', employee.org_id)
      .eq('status', 'active')
  ])

  const countMap: Record<string, number> = {}
  activeEmployees?.forEach((e) => {
    if (e.outlet_id) countMap[e.outlet_id] = (countMap[e.outlet_id] ?? 0) + 1
  })

  const outletsWithCounts = (outlets ?? []).map((o) => ({
    ...o,
    employee_count: countMap[o.id] ?? 0,
  }))

  return (
    <div className="animate-fade-in">
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">Outlets</h1>
          <p className="page-subtitle">
            {outletsWithCounts.length} location{outletsWithCounts.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <Link
          href="/admin/outlets/new"
          className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Outlet
        </Link>
      </div>

      {outletsWithCounts.length === 0 ? (
        <div className="geo-card">
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <h2 className="empty-state-title">No outlets yet</h2>
            <p className="empty-state-description">
              Add your first outlet to start configuring geofences and tracking attendance.
            </p>
            <Link
              href="/admin/outlets/new"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <MapPin className="w-4 h-4" />
              Add Your First Outlet
            </Link>
          </div>
        </div>
      ) : (
        <OutletTable outlets={outletsWithCounts} />
      )}
    </div>
  )
}
