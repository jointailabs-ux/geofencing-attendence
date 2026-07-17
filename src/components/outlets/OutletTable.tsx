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
        // Generate a pseudo-random color theme per card for vibrancy
        const themes = ['cyan', 'violet', 'emerald', 'amber', 'rose'] as const
        const theme = themes[idx % themes.length]
        
        return (
          <div key={outlet.id} className="group relative rounded-3xl p-6 bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all duration-300 overflow-hidden flex flex-col h-full hover:shadow-2xl hover:border-white/10">
            
            {/* Ambient Top Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 blur-[60px] rounded-full pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity duration-500"
              style={{
                background: theme === 'cyan' ? '#06B6D4' :
                            theme === 'violet' ? '#8B5CF6' :
                            theme === 'emerald' ? '#10B981' :
                            theme === 'amber' ? '#F59E0B' : '#F43F5E'
              }} />

            <div className="relative z-10 flex flex-col h-full">
              {/* Header */}
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg flex-shrink-0"
                  style={{
                    background: `rgba(var(--${theme}-500), 0.1)`,
                    borderColor: `rgba(var(--${theme}-500), 0.2)`,
                    color: `var(--${theme}-400)`
                  }}>
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-xl font-bold text-white truncate">{outlet.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-slate-400">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs truncate">{outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Workforce</span>
                  </div>
                  <span className="text-xl font-bold text-white">{outlet.employee_count}</span>
                </div>
                
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Ruler className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Radius</span>
                  </div>
                  <span className="text-xl font-bold text-white">{outlet.radius_meters}m</span>
                </div>

                <div className="col-span-2 bg-white/[0.02] border border-white/5 rounded-2xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-semibold uppercase tracking-wider">Buffer Zone</span>
                  </div>
                  <span className="text-sm font-bold text-white bg-white/5 px-2.5 py-1 rounded-lg">
                    +{outlet.buffer_meters}m
                  </span>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-auto pt-4 border-t border-white/5 flex gap-2">
                <Link
                  href={`/admin/outlets/${outlet.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/[0.03] text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors border border-white/5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit
                </Link>

                <div className="relative flex-1">
                  {confirmId === outlet.id ? (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-slate-800 rounded-xl border border-red-500/30 shadow-2xl z-20">
                      <p className="text-xs text-center text-slate-300 mb-3 font-medium">Delete outlet?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(outlet.id)}
                          disabled={deletingId === outlet.id}
                          className="flex-1 bg-red-500/20 text-red-400 text-xs font-bold py-1.5 rounded-lg hover:bg-red-500/30 transition-colors flex justify-center"
                        >
                          {deletingId === outlet.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes'}
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          disabled={deletingId === outlet.id}
                          className="flex-1 bg-white/10 text-slate-300 text-xs font-bold py-1.5 rounded-lg hover:bg-white/20 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <button
                    onClick={() => setConfirmId(outlet.id)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
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
