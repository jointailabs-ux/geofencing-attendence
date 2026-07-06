import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { OutletForm } from '@/components/outlets/OutletForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Edit Outlet' }

interface EditOutletPageProps {
  params: { id: string }
}

export default async function EditOutletPage({ params }: EditOutletPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: outlet } = await supabase
    .from('outlets')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!outlet) notFound()

  return <OutletForm outlet={outlet} />
}
