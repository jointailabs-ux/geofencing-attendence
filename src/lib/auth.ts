import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import type { Employee } from '@/lib/types/database'

export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user || null
})

export const getCachedEmployee = cache(async () => {
  const user = await getCachedUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: employee } = await supabase
    .from('employees')
    .select('*, outlets(*)')
    .eq('auth_user_id', user.id)
    .single()

  return employee as unknown as (Employee & { outlets?: { name: string, latitude: number, longitude: number, radius_meters: number, buffer_meters: number } }) | null
})
