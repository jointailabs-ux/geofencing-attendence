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
  AlertTriangle,
  Search,
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
      emp.email.toLowerCase().includes(search.toLowerCase())
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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input pl-9"
          />
        </div>
        <select
          value={filterOutlet}
          onChange={(e) => setFilterOutlet(e.target.value)}
          className="field-input sm:w-44"
        >
          <option value="">All outlets</option>
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="field-input sm:w-36"
        >
          <option value="">All roles</option>
          <option value="super_admin">Super Admin</option>
          <option value="manager">Manager</option>
          <option value="staff">Staff</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="field-input sm:w-36"
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="geo-card">
          <div className="empty-state py-10">
            <Search className="empty-state-icon" />
            <p className="empty-state-title">No employees found</p>
            <p className="empty-state-description">
              {search || filterOutlet || filterStatus || filterRole
                ? 'Try adjusting your filters'
                : 'Add your first employee to get started'}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="geo-card hidden lg:block overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr className="bg-[#0F172A]/40">
                    <th>Employee</th>
                    <th>Role</th>
                    <th>Outlet</th>
                    <th>Salary</th>
                    <th>Joined</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((emp) => (
                    <tr key={emp.id} className={cn(emp.status === 'inactive' && 'opacity-60')}>
                      <td>
                        <div>
                          <p className="font-semibold text-white">{emp.full_name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                          {emp.phone && (
                            <p className="text-xs text-slate-600">{emp.phone}</p>
                          )}
                        </div>
                      </td>
                      <td>
                        <StatusBadge variant={emp.role} size="sm" />
                      </td>
                      <td className="text-slate-400 text-sm">
                        {(emp.outlet as { name: string } | undefined)?.name ?? <span className="text-slate-600">—</span>}
                      </td>
                      <td>
                        <div>
                          <p className="text-slate-300 font-medium">
                            ₹{emp.base_salary.toLocaleString('en-IN')}
                          </p>
                          <StatusBadge variant={emp.salary_type} size="sm" showDot={false} />
                        </div>
                      </td>
                      <td className="text-slate-400 text-sm tabular">
                        {new Date(emp.join_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: '2-digit',
                        })}
                      </td>
                      <td>
                        <StatusBadge variant={emp.status} size="sm" />
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`${basePath}/employees/${emp.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          {actionId === emp.id ? (
                            <div className="flex items-center gap-2 bg-danger/10 border border-danger/20 rounded-lg px-3 py-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-danger" />
                              <span className="text-xs text-danger">Deactivate?</span>
                              <button
                                onClick={() => handleDeactivate(emp.id)}
                                disabled={loadingId === emp.id}
                                className="text-xs font-semibold text-danger"
                              >
                                {loadingId === emp.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : 'Yes'}
                              </button>
                              <button onClick={() => setActionId(null)} className="text-xs text-slate-400">
                                No
                              </button>
                            </div>
                          ) : emp.status === 'active' ? (
                            <button
                              onClick={() => setActionId(emp.id)}
                              className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                              title="Deactivate"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReactivate(emp.id)}
                              disabled={loadingId === emp.id}
                              className="p-1.5 text-slate-400 hover:text-valid hover:bg-valid/10 rounded-lg transition-colors"
                              title="Reactivate"
                            >
                              {loadingId === emp.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
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
            {filtered.map((emp) => (
              <div key={emp.id} className={cn('geo-card', emp.status === 'inactive' && 'opacity-60')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-white">{emp.full_name}</p>
                    <p className="text-xs text-slate-500">{emp.email}</p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3">
                    <Link
                      href={`${basePath}/employees/${emp.id}/edit`}
                      className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    {emp.status === 'active' ? (
                      <button
                        onClick={() => setActionId(emp.id)}
                        className="p-1.5 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivate(emp.id)}
                        className="p-1.5 text-slate-400 hover:text-valid hover:bg-valid/10 rounded-lg transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <StatusBadge variant={emp.role} size="sm" />
                  <StatusBadge variant={emp.status} size="sm" />
                  <StatusBadge variant={emp.salary_type} size="sm" showDot={false} />
                  {(emp.outlet as { name: string } | undefined)?.name && (
                    <span className="text-xs text-slate-500 bg-[#0F172A] px-2 py-0.5 rounded-full border border-[#334155]">
                      {(emp.outlet as { name: string }).name}
                    </span>
                  )}
                </div>
                {actionId === emp.id && (
                  <div className="mt-3 flex items-center gap-3 bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
                    <span className="text-sm text-danger flex-1">Deactivate {emp.full_name}?</span>
                    <button onClick={() => handleDeactivate(emp.id)} className="text-sm font-semibold text-danger">
                      Yes
                    </button>
                    <button onClick={() => setActionId(null)} className="text-sm text-slate-400">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-600 text-right">
            Showing {filtered.length} of {employees.length} employees
          </p>
        </>
      )}
    </div>
  )
}
