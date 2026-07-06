'use server'

import { createClient } from '@/lib/supabase/server'
import type { Holiday } from '@/lib/types/database'

export async function getHolidays(orgId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('holidays')
    .select('*')
    .eq('org_id', orgId)
    .order('date', { ascending: true })

  if (error) throw new Error('Failed to fetch holidays')
  return data as Holiday[]
}

export async function addHoliday(orgId: string, date: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('holidays')
    .insert({ org_id: orgId, date, name })

  if (error) {
    if (error.code === '23505') throw new Error('A holiday on this date already exists.')
    throw new Error('Failed to add holiday')
  }
  return { success: true }
}

export async function deleteHoliday(holidayId: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('holidays')
    .delete()
    .eq('id', holidayId)

  if (error) throw new Error('Failed to delete holiday')
  return { success: true }
}
