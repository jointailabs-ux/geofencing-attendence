'use client'

import { Users, Building2, ExternalLink } from 'lucide-react'
import { StatusBadge, type StatusVariant } from '@/components/ui/StatusBadge'

export function UserManagement({ users }: { users: { id: string; full_name: string; role: string; status: string; outlets: unknown }[] }) {
  return (
    <div className="geo-card !p-0 overflow-hidden">
      <div className="p-5 border-b border-[#1E293B] flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-accent" />
            User Management
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage admins and managers</p>
        </div>
        <a 
          href="/admin/employees/new" 
          className="btn-primary"
        >
          Invite User
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#0F172A] text-xs uppercase text-slate-500 font-semibold border-b border-[#1E293B]">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Outlet</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1E293B]">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                  No management users found.
                </td>
              </tr>
            ) : (
              users.map(u => (
                <tr key={u.id} className="hover:bg-[#1E293B]/30">
                  <td className="px-5 py-4 font-medium text-white">{u.full_name}</td>
                  <td className="px-5 py-4">
                    <StatusBadge variant={u.role as StatusVariant} size="sm" />
                  </td>
                  <td className="px-5 py-4 text-slate-400">
                    {u.outlets ? (
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" />
                        {(u.outlets as { name: string }).name}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge variant={u.status as StatusVariant} size="sm" />
                  </td>
                  <td className="px-5 py-4">
                    <a 
                      href={`/admin/employees/${u.id}/edit`}
                      className="inline-flex items-center gap-1 text-accent hover:text-accent-hover text-xs font-medium transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Manage
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
