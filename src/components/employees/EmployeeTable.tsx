'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deactivateEmployee, reactivateEmployee, deleteEmployee } from '@/app/actions/employees'
import { StatusBadge } from '@/components/ui/StatusBadge'
import type { Employee, Outlet } from '@/lib/types/database'
import {
  Edit2,
  UserX,
  UserCheck,
  Loader2,
  Search,
  MapPin,
  Mail,
  Trash2,
} from 'lucide-react'

interface EmployeeTableProps {
  employees: (Employee & { outlets?: Pick<Outlet, 'id' | 'name'>; outlet?: Pick<Outlet, 'id' | 'name'> })[]
  outlets: Pick<Outlet, 'id' | 'name'>[]
  basePath: string
}

export function EmployeeTable({ employees, outlets, basePath }: EmployeeTableProps) {
  const [search, setSearch] = useState('')
  const [filterOutlet, setFilterOutlet] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const filtered = employees.filter((emp) => {
    const matchSearch =
      !search ||
      emp.full_name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.employee_code && emp.employee_code.toLowerCase().includes(search.toLowerCase()))
    const matchOutlet = !filterOutlet || emp.outlet_id === filterOutlet
    const matchStatus = !filterStatus || emp.status === filterStatus
    const matchRole = !filterRole || emp.role === filterRole
    return matchSearch && matchOutlet && matchStatus && matchRole
  })

  async function handleDeactivate(id: string) {
    setLoadingId(id)
    const result = await deactivateEmployee(id)
    if (result?.error) toast.error(result.error)
    else toast.success('Employee deactivated')
    setLoadingId(null)
  }

  async function handleReactivate(id: string) {
    setLoadingId(id)
    const result = await reactivateEmployee(id)
    if (result?.error) toast.error(result.error)
    else toast.success('Employee reactivated')
    setLoadingId(null)
  }

  async function handleDelete(id: string) {
    setLoadingId(id)
    const result = await deleteEmployee(id)
    if (result?.error) toast.error(result.error)
    else toast.success('Employee deleted successfully')
    setLoadingId(null)
    setDeleteConfirmId(null)
    window.location.reload()
  }

  const getRoleColor = (role: string) => {
    if (role === 'super_admin') return 'violet'
    if (role === 'manager') return 'cyan'
    return 'emerald'
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-3xl bg-white/[0.02] border border-white/5 shadow-xl backdrop-blur-xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, code…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
          />
        </div>
        <div className="flex flex-wrap sm:flex-nowrap gap-3">
          <select
            value={filterOutlet}
            onChange={(e) => setFilterOutlet(e.target.value)}
            className="flex-1 sm:w-40 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Outlets</option>
            {outlets.map((o) => (
              <option key={o.id} value={o.id} className="bg-slate-900">{o.name}</option>
            ))}
          </select>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="flex-1 sm:w-36 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Roles</option>
            <option value="super_admin" className="bg-slate-900">Super Admin</option>
            <option value="manager" className="bg-slate-900">Manager</option>
            <option value="staff" className="bg-slate-900">Staff</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 sm:w-36 bg-white/[0.03] border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">All Statuses</option>
            <option value="active" className="bg-slate-900">Active</option>
            <option value="inactive" className="bg-slate-900">Inactive</option>
          </select>
        </div>
      </div>

      {/* Grid of Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 rounded-3xl bg-white/[0.01] border border-white/5">
          <p className="text-slate-400">No employees found matching the filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((emp) => {
            const roleColor = getRoleColor(emp.role)
            // Handle both outlets or outlet property
            const outletsObj = emp.outlets as unknown as { name?: string } | undefined
            const outletObj = emp.outlet as unknown as { name?: string } | undefined
            const outletName = outletsObj?.name || outletObj?.name || 'Unassigned'

            return (
              <div
                key={emp.id}
                className="group relative rounded-3xl mt-6 p-1 flex flex-col h-full hover:-translate-y-1 transition-all duration-500 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10"
                style={{
                  background:
                    roleColor === 'violet'
                      ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)'
                      : roleColor === 'cyan'
                      ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                }}
              >
                {/* Floating Detached Avatar */}
                <div
                  className="absolute -top-8 left-6 z-20 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-2xl border-4 border-[#0a0f1e] text-white"
                  style={{
                    background:
                      roleColor === 'violet'
                        ? 'linear-gradient(135deg, #c084fc, #ec4899)'
                        : roleColor === 'cyan'
                        ? 'linear-gradient(135deg, #22d3ee, #3b82f6)'
                        : 'linear-gradient(135deg, #34d399, #059669)',
                  }}
                >
                  {emp.full_name.charAt(0).toUpperCase()}
                </div>

                {/* Status Badge */}
                <div className="absolute -top-3 right-4 z-20 shadow-lg rounded-full">
                  <StatusBadge variant={emp.status} size="sm" />
                </div>

                <div className="relative z-10 flex flex-col h-full bg-slate-950/70 backdrop-blur-md rounded-[22px] pt-10 px-5 pb-5 transition-colors duration-500 group-hover:bg-slate-950/50">
                  {/* Info */}
                  <div className="mb-4 flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-white drop-shadow-md">
                      {emp.full_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <StatusBadge variant={emp.role} size="sm" showDot={false} />
                      {emp.employee_code && (
                        <span className="text-[10px] font-bold font-mono bg-white text-slate-900 px-2 py-0.5 rounded-md shadow-sm">
                          {emp.employee_code}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-3 mb-6 bg-white/5 border border-white/10 p-3 rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                    <div className="flex items-center gap-2.5 text-sm text-white/80 font-medium">
                      <Mail className="w-4 h-4 opacity-70" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-white/80 font-medium">
                      <MapPin className="w-4 h-4 text-cyan-400 opacity-90" />
                      <span className="truncate font-semibold text-cyan-300">{outletName}</span>
                    </div>
                  </div>

                  {/* Actions Footer: Edit, Disable, Delete */}
                  <div className="mt-auto pt-4 border-t border-white/20 flex gap-2">
                    <Link
                      href={`${basePath}/employees/${emp.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-white hover:bg-white/20 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Link>

                    {emp.status === 'active' ? (
                      <button
                        onClick={() => handleDeactivate(emp.id)}
                        disabled={loadingId === emp.id}
                        className="py-2 px-2.5 rounded-xl bg-amber-500/20 backdrop-blur-md border border-amber-500/30 text-xs font-bold text-amber-300 hover:bg-amber-500/40 transition-all"
                        title="Deactivate Employee"
                      >
                        {loadingId === emp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserX className="w-3.5 h-3.5" />}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(emp.id)}
                        disabled={loadingId === emp.id}
                        className="py-2 px-2.5 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-xs font-bold text-emerald-300 hover:bg-emerald-500/40 transition-all"
                        title="Enable Employee"
                      >
                        {loadingId === emp.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Delete Staff Button */}
                    <div className="relative">
                      {deleteConfirmId === emp.id ? (
                        <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-rose-950/95 backdrop-blur-xl rounded-xl border border-rose-500/50 shadow-2xl z-30 space-y-2">
                          <p className="text-[11px] text-center text-white font-bold">Permanently delete staff?</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDelete(emp.id)}
                              disabled={loadingId === emp.id}
                              className="flex-1 bg-rose-600 text-white text-[10px] font-bold py-1 rounded-lg hover:bg-rose-500 transition-colors flex justify-center"
                            >
                              {loadingId === emp.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="flex-1 bg-white/20 text-white text-[10px] font-bold py-1 rounded-lg hover:bg-white/30"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <button
                        onClick={() => setDeleteConfirmId(emp.id)}
                        className="py-2 px-2.5 rounded-xl bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-xs font-bold text-rose-300 hover:bg-rose-500/40 hover:text-white transition-all"
                        title="Delete Staff"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

