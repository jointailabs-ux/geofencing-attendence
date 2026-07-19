'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { deactivateEmployee, reactivateEmployee } from '@/app/actions/employees'
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
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmployeeTableProps {
  employees: (Employee & { outlet?: Pick<Outlet, 'id' | 'name'> })[]
  outlets: Pick<Outlet, 'id' | 'name'>[]
  basePath: string // '/admin' or '/manager'
}

export function EmployeeTable({ employees, outlets, basePath }: EmployeeTableProps) {
  const [search, setSearch] = useState('')
  const [filterOutlet, setFilterOutlet] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterRole, setFilterRole] = useState('')
  const [actionId, setActionId] = useState<string | null>(null)
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
    setActionId(null)
  }

  async function handleReactivate(id: string) {
    setLoadingId(id)
    const result = await reactivateEmployee(id)
    if (result?.error) toast.error(result.error)
    else toast.success('Employee reactivated')
    setLoadingId(null)
  }

  const getRoleColor = (role: string) => {
    if (role === 'super_admin') return 'violet'
    if (role === 'manager') return 'cyan'
    return 'emerald'
  }

  return (
    <div className="space-y-6">
      {/* Filters (Glassmorphism Bar) */}
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
            return (
              <div key={emp.id} className="group relative rounded-3xl mt-6 p-1 flex flex-col h-full hover:-translate-y-1 transition-all duration-500 shadow-2xl hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-white/10"
                style={{
                  background: roleColor === 'violet' ? 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' :
                              roleColor === 'cyan' ? 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)' :
                              'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                }}>
                
                {/* Floating Detached Avatar */}
                <div className="absolute -top-8 left-6 z-20 w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-2xl border-4 border-[#0a0f1e] text-white"
                  style={{
                    background: roleColor === 'violet' ? 'linear-gradient(135deg, #c084fc, #ec4899)' :
                                roleColor === 'cyan' ? 'linear-gradient(135deg, #22d3ee, #3b82f6)' :
                                'linear-gradient(135deg, #34d399, #059669)'
                  }}>
                  {emp.full_name.charAt(0).toUpperCase()}
                </div>

                {/* Status Badge floating on top right */}
                <div className="absolute -top-3 right-4 z-20 shadow-lg rounded-full">
                  <StatusBadge variant={emp.status} size="sm" />
                </div>

                <div className="relative z-10 flex flex-col h-full bg-slate-950/70 backdrop-blur-md rounded-[22px] pt-10 px-5 pb-5 transition-colors duration-500 group-hover:bg-slate-950/50">
                  {/* Info */}
                  <div className="mb-4 flex-1">
                    <h3 className="text-xl font-bold text-white group-hover:text-white drop-shadow-md">{emp.full_name}</h3>
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
                      <MapPin className="w-4 h-4 opacity-70" />
                      <span className="truncate">{emp.outlet?.name ?? 'No Outlet'}</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-auto pt-4 border-t border-white/20 flex gap-2">
                    <Link
                      href={`${basePath}/employees/${emp.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-sm font-bold text-white hover:bg-white/20 transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Link>

                    {emp.status === 'active' ? (
                      <div className="relative flex-1">
                        {actionId === emp.id ? (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 p-3 bg-red-950/90 backdrop-blur-xl rounded-xl border border-red-500/50 shadow-2xl z-30">
                            <p className="text-xs text-center text-white mb-3 font-bold">Deactivate account?</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleDeactivate(emp.id)}
                                disabled={loadingId === emp.id}
                                className="flex-1 bg-red-500 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-red-400 transition-colors flex justify-center shadow-md"
                              >
                                {loadingId === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes'}
                              </button>
                              <button
                                onClick={() => setActionId(null)}
                                disabled={loadingId === emp.id}
                                className="flex-1 bg-white/20 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-white/30 transition-colors"
                              >
                                No
                              </button>
                            </div>
                          </div>
                        ) : null}
                        <button
                          onClick={() => setActionId(emp.id)}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/20 backdrop-blur-md border border-red-500/30 text-sm font-bold text-red-200 hover:bg-red-500/40 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                        >
                          <UserX className="w-4 h-4" />
                          Disable
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleReactivate(emp.id)}
                        disabled={loadingId === emp.id}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 text-sm font-bold text-emerald-200 hover:bg-emerald-500/40 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                      >
                        {loadingId === emp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                        Enable
                      </button>
                    )}
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
