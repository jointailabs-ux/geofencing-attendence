'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const OutletSchema = z.object({
  name: z.string().min(1, 'Outlet name is required').max(100),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius_meters: z.coerce.number().int().min(50).max(1000),
  buffer_meters: z.coerce.number().int().min(0).max(100),
})

async function getAdminOrgId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: employee } = await supabase
    .from('employees')
    .select('org_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!employee || employee.role !== 'super_admin') return null
  return employee.org_id
}

// ─── Create outlet ─────────────────────────────────────────────────────────────
export async function createOutlet(formData: FormData) {
  const orgId = await getAdminOrgId()
  if (!orgId) return { error: 'Unauthorized' }

  const raw = {
    name: formData.get('name'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    radius_meters: formData.get('radius_meters'),
    buffer_meters: formData.get('buffer_meters'),
  }

  const parsed = OutletSchema.safeParse(raw)
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e: { message: string }) => e.message).join(', ')
    return { error: messages }
  }

  const supabase = createServiceClient()
  const { error } = await supabase.from('outlets').insert({
    org_id: orgId,
    ...parsed.data,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/outlets')
  redirect('/admin/outlets')
}

// ─── Update outlet ─────────────────────────────────────────────────────────────
export async function updateOutlet(outletId: string, formData: FormData) {
  const orgId = await getAdminOrgId()
  if (!orgId) return { error: 'Unauthorized' }

  const raw = {
    name: formData.get('name'),
    address: formData.get('address'),
    latitude: formData.get('latitude'),
    longitude: formData.get('longitude'),
    radius_meters: formData.get('radius_meters'),
    buffer_meters: formData.get('buffer_meters'),
  }

  const parsed = OutletSchema.safeParse(raw)
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e: { message: string }) => e.message).join(', ')
    return { error: messages }
  }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('outlets')
    .update(parsed.data)
    .eq('id', outletId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/admin/outlets')
  redirect('/admin/outlets')
}

// ─── Delete outlet ─────────────────────────────────────────────────────────────
export async function deleteOutlet(outletId: string) {
  const orgId = await getAdminOrgId()
  if (!orgId) return { error: 'Unauthorized' }

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('outlets')
    .delete()
    .eq('id', outletId)
    .eq('org_id', orgId)

  if (error) return { error: error.message }

  revalidatePath('/admin/outlets')
  return { success: true }
}

// ─── Get outlets with employee counts ─────────────────────────────────────────
export async function getOutlets() {
  const orgId = await getAdminOrgId()
  if (!orgId) return { error: 'Unauthorized', data: null }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('outlets')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, data: null }

  // Get employee counts per outlet
  const outletIds = data.map((o) => o.id)
  const { data: empCounts } = await supabase
    .from('employees')
    .select('outlet_id')
    .in('outlet_id', outletIds)
    .eq('status', 'active')

  const countMap: Record<string, number> = {}
  empCounts?.forEach((e) => {
    if (e.outlet_id) countMap[e.outlet_id] = (countMap[e.outlet_id] ?? 0) + 1
  })

  const outletsWithCounts = data.map((o) => ({
    ...o,
    employee_count: countMap[o.id] ?? 0,
  }))

  return { data: outletsWithCounts, error: null }
}
