'use client'

import { useState, useMemo } from 'react'
import { getOutletColor } from '@/lib/outletColors'
import {
  Search,
  Filter,
  MapPin,
  Play,
  LogOut,
  Zap,
  Coffee,
  Pause,
  ShieldCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  UserX,
} from 'lucide-react'

export type LiveRosterEmployee = {
  id: string
  name: string
  role: string
  outletName: string
  clockInTime: string | null
  clockOutTime: string | null
  currentStatus: 'WORKING' | 'ON_BREAK' | 'SHIFT_ENDED' | 'NOT_STARTED'
  hoursWorkedStr: string
  breakTimeStr: string
  hasFlags: boolean
  lastLogTime: string | null
  distanceMeters: number | null
}

interface LiveWorkforceRosterProps {
  liveRoster: LiveRosterEmployee[]
  outlets?: { id: string; name: string }[]
}

const ITEMS_PER_PAGE = 8

export function LiveWorkforceRoster({ liveRoster, outlets = [] }: LiveWorkforceRosterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOutlet, setSelectedOutlet] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Unique Outlet names
  const outletOptions = useMemo(() => {
    if (outlets.length > 0) {
      return outlets.map((o) => o.name)
    }
    const names = new Set(liveRoster.map((e) => e.outletName))
    return Array.from(names).filter((n) => n && n !== 'Unassigned')
  }, [outlets, liveRoster])

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return liveRoster.filter((emp) => {
      const matchesName = emp.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
      const matchesOutlet =
        selectedOutlet === 'all' || emp.outletName.toLowerCase() === selectedOutlet.toLowerCase()
      const matchesStatus = selectedStatus === 'all' || emp.currentStatus === selectedStatus

      return matchesName && matchesOutlet && matchesStatus
    })
  }, [liveRoster, searchQuery, selectedOutlet, selectedStatus])

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredRoster.length / ITEMS_PER_PAGE))
  const safeCurrentPage = Math.min(currentPage, totalPages)

  const paginatedRoster = useMemo(() => {
    const start = (safeCurrentPage - 1) * ITEMS_PER_PAGE
    return filteredRoster.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredRoster, safeCurrentPage])

  // Status counters for filter pills
  const statusCounts = useMemo(() => {
    return {
      all: liveRoster.length,
      WORKING: liveRoster.filter((e) => e.currentStatus === 'WORKING').length,
      ON_BREAK: liveRoster.filter((e) => e.currentStatus === 'ON_BREAK').length,
      SHIFT_ENDED: liveRoster.filter((e) => e.currentStatus === 'SHIFT_ENDED').length,
      NOT_STARTED: liveRoster.filter((e) => e.currentStatus === 'NOT_STARTED').length,
    }
  }, [liveRoster])

  return (
    <div className="rounded-3xl overflow-hidden bg-white/[0.02] border border-white/5 shadow-2xl">
      {/* Header & Controls Section */}
      <div className="p-6 space-y-4 border-b border-white/5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Live Workforce Roster ({filteredRoster.length} of {liveRoster.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Each staff card is dynamically color-matched to their assigned outlet location.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
              Outlet Color-Coded
            </span>
          </div>
        </div>

        {/* Filter Toolbar: Search Input + Outlet Select */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
          {/* Search Input */}
          <div className="sm:col-span-7 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Search employee by name..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
          </div>

          {/* Outlet Filter Select */}
          <div className="sm:col-span-5 relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedOutlet}
              onChange={(e) => {
                setSelectedOutlet(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors cursor-pointer appearance-none"
            >
              <option value="all">All Outlets ({liveRoster.length})</option>
              {outletOptions.map((name) => {
                const theme = getOutletColor(name)
                return (
                  <option key={name} value={name} style={{ color: theme.text }}>
                    Outlet: {name}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        {/* Quick Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {[
            { id: 'all', label: 'All Statuses', count: statusCounts.all, color: 'text-slate-300' },
            { id: 'WORKING', label: 'Working Now', count: statusCounts.WORKING, color: 'text-emerald-400' },
            { id: 'ON_BREAK', label: 'On Break', count: statusCounts.ON_BREAK, color: 'text-amber-400' },
            { id: 'SHIFT_ENDED', label: 'Shift Ended', count: statusCounts.SHIFT_ENDED, color: 'text-indigo-400' },
            { id: 'NOT_STARTED', label: 'Not Clocked In', count: statusCounts.NOT_STARTED, color: 'text-slate-400' },
          ].map((pill) => {
            const isSelected = selectedStatus === pill.id
            return (
              <button
                key={pill.id}
                onClick={() => {
                  setSelectedStatus(pill.id)
                  setCurrentPage(1)
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  isSelected
                    ? 'bg-white/15 border-white/30 text-white shadow-lg'
                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <span className={pill.color}>{pill.label}</span>
                <span className="bg-white/10 px-1.5 py-0.2 rounded-md text-[10px] font-mono text-white">
                  {pill.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Scrollable Content Container with Fixed Max Height */}
      <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
        {paginatedRoster.length === 0 ? (
          <div className="py-16 text-center text-slate-400 space-y-3">
            <UserX className="w-12 h-12 mx-auto text-slate-600 opacity-60" />
            <p className="text-sm font-semibold">No employees found matching filter criteria.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedOutlet('all')
                setSelectedStatus('all')
                setCurrentPage(1)
              }}
              className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Mobile View: Scroll-free responsive cards color-matched to assigned outlet */}
            <div className="block lg:hidden p-4 space-y-3">
              {paginatedRoster.map((emp) => {
                const theme = getOutletColor(emp.outletName)

                return (
                  <div
                    key={emp.id}
                    className="p-4 rounded-2xl space-y-3 transition-all"
                    style={{
                      background: theme.bgTint,
                      border: `1px solid ${theme.border}`,
                    }}
                  >
                    {/* Top Row: Staff Info & Status Pill */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Avatar with Outlet Gradient */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md text-sm shrink-0 border border-white/20"
                          style={{ background: theme.gradient }}
                        >
                          {emp.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white text-sm truncate">{emp.name}</p>
                          <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                            {emp.role.replace('_', ' ')}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {emp.currentStatus === 'WORKING' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            WORKING
                          </span>
                        )}
                        {emp.currentStatus === 'ON_BREAK' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Pause className="w-3 h-3 animate-pulse" />
                            ON BREAK
                          </span>
                        )}
                        {emp.currentStatus === 'SHIFT_ENDED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                            <ShieldCheck className="w-3 h-3" />
                            ENDED
                          </span>
                        )}
                        {emp.currentStatus === 'NOT_STARTED' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                            NOT STARTED
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle Metrics Grid (2x2) */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-2.5 rounded-xl border border-white/5 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Clock In</span>
                        <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                          <Play className="w-3 h-3" />
                          {emp.clockInTime}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Clock Out</span>
                        <span className="font-bold text-indigo-300 flex items-center gap-1 mt-0.5">
                          <LogOut className="w-3 h-3" />
                          {emp.clockOutTime}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Hours Worked</span>
                        <span className="font-bold text-white flex items-center gap-1 mt-0.5">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          {emp.hoursWorkedStr}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Break Duration</span>
                        <span className="font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                          <Coffee className="w-3 h-3" />
                          {emp.breakTimeStr}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Footer: Outlet Color Badge & Flags */}
                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold"
                        style={{
                          background: theme.badgeBg,
                          color: theme.badgeText,
                          border: `1px solid ${theme.badgeBorder}`,
                        }}
                      >
                        <MapPin className="w-3 h-3" />
                        {emp.outletName}
                      </span>

                      {emp.hasFlags && (
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Flagged
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <table className="w-full text-left text-sm text-slate-300 border-collapse">
                <thead className="text-xs uppercase text-slate-500 font-bold bg-slate-950/80 sticky top-0 backdrop-blur-md border-b border-white/5 z-10">
                  <tr>
                    <th className="px-6 py-4">Employee</th>
                    <th className="px-6 py-4">Outlet Location</th>
                    <th className="px-6 py-4">Clock In</th>
                    <th className="px-6 py-4">Clock Out</th>
                    <th className="px-6 py-4">Hours Worked</th>
                    <th className="px-6 py-4">Break Time</th>
                    <th className="px-6 py-4">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedRoster.map((emp) => {
                    const theme = getOutletColor(emp.outletName)

                    return (
                      <tr key={emp.id} className="hover:bg-white/[0.03] transition-colors group">
                        {/* Employee Avatar & Name with Outlet Gradient */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-md text-sm border border-white/20"
                              style={{ background: theme.gradient }}
                            >
                              {emp.name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                                {emp.name}
                              </p>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md mt-1 inline-block">
                                {emp.role.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Outlet Color Badge */}
                        <td className="px-6 py-4">
                          <span
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold"
                            style={{
                              background: theme.badgeBg,
                              color: theme.badgeText,
                              border: `1px solid ${theme.badgeBorder}`,
                            }}
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ background: theme.dot }}
                            />
                            {emp.outletName}
                          </span>
                        </td>

                        {/* Clock In Time */}
                        <td className="px-6 py-4 font-mono">
                          {emp.clockInTime !== '--:--' ? (
                            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                              <Play className="w-3.5 h-3.5" />
                              {emp.clockInTime}
                            </div>
                          ) : (
                            <span className="text-slate-600">--:--</span>
                          )}
                        </td>

                        {/* Clock Out Time / Status */}
                        <td className="px-6 py-4 font-mono">
                          {emp.clockOutTime === 'In Progress' ? (
                            <span className="text-cyan-400 font-semibold">Active Shift</span>
                          ) : emp.clockOutTime === 'On Break' ? (
                            <span className="text-amber-400 font-semibold">On Break</span>
                          ) : emp.clockOutTime !== '--:--' ? (
                            <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                              <LogOut className="w-3.5 h-3.5" />
                              {emp.clockOutTime}
                            </div>
                          ) : (
                            <span className="text-slate-600">--:--</span>
                          )}
                        </td>

                        {/* Hours Worked */}
                        <td className="px-6 py-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-cyan-400" />
                            <span className="font-bold text-white text-base">{emp.hoursWorkedStr}</span>
                          </div>
                        </td>

                        {/* Break Duration */}
                        <td className="px-6 py-4 font-mono">
                          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                            <Coffee className="w-3.5 h-3.5" />
                            {emp.breakTimeStr}
                          </div>
                        </td>

                        {/* Current Status Pill */}
                        <td className="px-6 py-4">
                          {emp.currentStatus === 'WORKING' && (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                              </span>
                              WORKING
                            </span>
                          )}

                          {emp.currentStatus === 'ON_BREAK' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                              <Pause className="w-3.5 h-3.5 animate-pulse" />
                              ON BREAK
                            </span>
                          )}

                          {emp.currentStatus === 'SHIFT_ENDED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                              <ShieldCheck className="w-3.5 h-3.5" />
                              SHIFT ENDED
                            </span>
                          )}

                          {emp.currentStatus === 'NOT_STARTED' && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-500 border border-slate-700">
                              NOT STARTED
                            </span>
                          )}

                          {emp.hasFlags && (
                            <span
                              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20"
                              title="Flagged out of range"
                            >
                              <AlertTriangle className="w-3 h-3" /> Flagged
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-white/5 flex items-center justify-between gap-4 bg-white/[0.01]">
          <span className="text-xs font-medium text-slate-400">
            Showing Page <strong className="text-white">{safeCurrentPage}</strong> of{' '}
            <strong className="text-white">{totalPages}</strong> ({filteredRoster.length} total)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400 px-2">
              {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed border border-white/5 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
