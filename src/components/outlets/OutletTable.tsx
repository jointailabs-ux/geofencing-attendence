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
  AlertTriangle,
  Loader2,
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

  return (
    <>
      {/* Desktop table */}
      <div className="geo-card hidden lg:block overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr className="bg-[#0F172A]/40">
                <th>Outlet</th>
                <th>Coordinates</th>
                <th>Radius</th>
                <th>Buffer</th>
                <th>Staff</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {outlets.map((outlet) => (
                <tr key={outlet.id}>
                  <td>
                    <div>
                      <p className="font-semibold text-white">{outlet.name}</p>
                      {outlet.address && (
                        <p className="text-xs text-slate-500 mt-0.5 max-w-xs truncate">
                          {outlet.address}
                        </p>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="font-mono text-xs text-slate-400">
                      <div>{outlet.latitude.toFixed(5)}</div>
                      <div>{outlet.longitude.toFixed(5)}</div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Ruler className="w-3.5 h-3.5 text-accent" />
                      <span className="text-slate-300">{outlet.radius_meters}m</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-warn" />
                      <span className="text-slate-300">{outlet.buffer_meters}m</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-valid" />
                      <span className="text-slate-300">{outlet.employee_count}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/outlets/${outlet.id}/edit`}
                        className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                        title="Edit outlet"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      {confirmId === outlet.id ? (
                        <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-lg px-3 py-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                          <span className="text-xs text-danger">Delete?</span>
                          <button
                            onClick={() => handleDelete(outlet.id)}
                            disabled={deletingId === outlet.id}
                            className="text-xs font-semibold text-danger hover:text-white transition-colors"
                          >
                            {deletingId === outlet.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              'Yes'
                            )}
                          </button>
                          <button
                            onClick={() => setConfirmId(null)}
                            className="text-xs text-slate-400 hover:text-white transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmId(outlet.id)}
                          className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                          title="Delete outlet"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {outlets.map((outlet) => (
          <div key={outlet.id} className="geo-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{outlet.name}</h3>
                {outlet.address && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{outlet.address}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 ml-3 flex-shrink-0">
                <Link
                  href={`/admin/outlets/${outlet.id}/edit`}
                  className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setConfirmId(outlet.id)}
                  className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Radius</p>
                <div className="flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-accent" />
                  <span className="text-slate-300">{outlet.radius_meters}m</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Buffer</p>
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-warn" />
                  <span className="text-slate-300">{outlet.buffer_meters}m</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Staff</p>
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-valid" />
                  <span className="text-slate-300">{outlet.employee_count}</span>
                </div>
              </div>
            </div>

            {confirmId === outlet.id && (
              <div className="mt-3 flex items-center gap-3 bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5">
                <AlertTriangle className="w-4 h-4 text-danger flex-shrink-0" />
                <span className="text-sm text-danger flex-1">Delete this outlet?</span>
                <button
                  onClick={() => handleDelete(outlet.id)}
                  disabled={deletingId === outlet.id}
                  className="text-sm font-semibold text-danger"
                >
                  {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="text-sm text-slate-400"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
