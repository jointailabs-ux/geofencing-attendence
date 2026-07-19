'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deleteOutlet } from '@/app/actions/outlets'
import type { Outlet } from '@/lib/types/database'
import {
  Users,
  Edit2,
  Trash2,
  Ruler,
  Shield,
  Loader2,
  Building2,
  MapPin,
} from 'lucide-react'

interface OutletTableProps {
  outlets: (Outlet & { employee_count: number })[]
}

export function OutletTable({ outlets }: OutletTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeletingId(id)
    const result = await deleteOutlet(id)
    if (result?.error) {
      toast.error('Failed to delete: ' + result.error)
    } else {
      toast.success('Outlet deleted')
    }
    setDeletingId(null)
    setConfirmId(null)
  }

  if (outlets.length === 0) {
    return (
      <div className="text-center py-20 rounded-3xl bg-white/[0.01] border border-white/5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
          <Building2 className="w-8 h-8 text-cyan-400" />
        </div>
        <p className="text-white font-medium text-lg">No outlets created yet</p>
        <p className="text-slate-400 text-sm mt-1">Add your first location to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {outlets.map((outlet, idx) => {
        // Generate a vivid mesh gradient per card
        const gradients = [
          'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)', // cyan to blue
          'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', // violet to fuchsia
          'linear-gradient(135deg, #10b981 0%, #059669 100%)', // emerald to green
          'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', // amber to red
          'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)', // pink to violet
        ]
        const gradient = gradients[idx % gradients.length]
        
        return (
          <div key={outlet.id} className="group relative rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:-translate-y-1 transition-all duration-500 flex flex-col h-full border border-white/10"
            style={{ background: gradient }}>
            
            {/* Dark glass overlay to make text readable but keep colors vibrant */}
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] group-hover:bg-slate-950/40 transition-colors duration-500" />
            
            {/* Glowing orb accent */}
            <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 blur-[50px] rounded-full mix-blend-overlay group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

            <div className="relative z-10 p-6 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/10 backdrop-blur-md border border-white/20 shadow-lg flex-shrink-0 text-white">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <h3 className="text-xl font-bold text-white truncate drop-shadow-md">{outlet.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-white/80">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate font-medium">{outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col gap-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Workforce</span>
                  </div>
                  <span className="text-2xl font-bold text-white drop-shadow-sm">{outlet.employee_count}</span>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col gap-1 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Ruler className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Radius</span>
                  </div>
                  <span className="text-2xl font-bold text-white drop-shadow-sm">{outlet.radius_meters}m</span>
                </div>

                <div className="col-span-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex items-center justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Buffer Zone</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 bg-white px-3 py-1 rounded-lg shadow-sm">
                    +{outlet.buffer_meters}m
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-auto pt-4 border-t border-white/20 flex gap-2">
                <Link
                  href={`/admin/outlets/${outlet.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold text-white hover:bg-white/20 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Link>

                <div className="relative flex-1">
                  {confirmId === outlet.id ? (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-red-950/90 backdrop-blur-xl rounded-xl border border-red-500/50 shadow-2xl z-20">
                      <p className="text-xs text-center text-white mb-3 font-bold">Delete outlet?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(outlet.id)}
                          disabled={deletingId === outlet.id}
                          className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-400 transition-colors flex justify-center shadow-md"
                        >
                          {deletingId === outlet.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          disabled={deletingId === outlet.id}
                          className="flex-1 bg-white/20 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <button
                    onClick={() => setConfirmId(outlet.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-sm font-bold text-red-200 hover:bg-red-500/40 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
