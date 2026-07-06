import { OutletForm } from '@/components/outlets/OutletForm'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Outlet' }

export default function NewOutletPage() {
  return <OutletForm />
}
