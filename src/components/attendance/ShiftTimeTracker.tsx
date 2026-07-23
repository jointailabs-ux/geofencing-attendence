'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { AttendanceLog } from '@/lib/types/database'
import { Clock, Play, Pause, LogOut, ShieldCheck, MapPin, Zap } from 'lucide-react'

type ExtendedAttendanceLog = AttendanceLog & {
  is_final_checkout?: boolean
}

interface ShiftTimeTrackerProps {
  todayLogs: AttendanceLog[]
  outletName?: string
}

export function ShiftTimeTracker({ todayLogs, outletName }: ShiftTimeTrackerProps) {
  // Sort logs chronologically (oldest first) for time calculations
  const chronologicalLogs: ExtendedAttendanceLog[] = useMemo(() => {
    return [...todayLogs].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [todayLogs])

  const firstInLog = chronologicalLogs.find((l) => l.type === 'check_in')
  const lastLog = chronologicalLogs.length > 0 ? chronologicalLogs[chronologicalLogs.length - 1] : null

  // Calculate elapsed active work milliseconds
  const computeActiveMs = useCallback(() => {
    let ms = 0
    let lastInTime: number | null = null

    for (const log of chronologicalLogs) {
      const logTime = new Date(log.timestamp).getTime()
      if (log.type === 'check_in') {
        lastInTime = logTime
      } else if (log.type === 'check_out') {
        if (lastInTime !== null) {
          ms += logTime - lastInTime
          lastInTime = null
        }
      }
    }

    if (lastInTime !== null) {
      ms += Date.now() - lastInTime
    }

    return Math.max(0, ms)
  }, [chronologicalLogs])

  const [activeMs, setActiveMs] = useState<number>(0)

  // Live timer effect when currently clocked in
  useEffect(() => {
    setActiveMs(computeActiveMs())

    if (!lastLog || lastLog.type !== 'check_in') {
      return
    }

    const interval = setInterval(() => {
      setActiveMs(computeActiveMs())
    }, 1000)

    return () => clearInterval(interval)
  }, [lastLog, computeActiveMs])

  // Formatting helpers
  const hours = Math.floor(activeMs / (1000 * 60 * 60))
  const minutes = Math.floor((activeMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((activeMs % (1000 * 60)) / 1000)

  const clockInTimeStr = firstInLog
    ? new Date(firstInLog.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '--:--'

  let clockOutTimeStr = '--:--'
  let currentStatus: 'NOT_STARTED' | 'ACTIVE' | 'ON_BREAK' | 'SHIFT_ENDED' = 'NOT_STARTED'

  if (!lastLog) {
    currentStatus = 'NOT_STARTED'
  } else if (lastLog.type === 'check_in') {
    currentStatus = 'ACTIVE'
    clockOutTimeStr = 'In Progress'
  } else {
    if (lastLog.is_final_checkout) {
      currentStatus = 'SHIFT_ENDED'
      clockOutTimeStr = new Date(lastLog.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    } else {
      currentStatus = 'ON_BREAK'
      clockOutTimeStr = 'On Break'
    }
  }

  return (
    <div
      className="rounded-3xl p-6 relative overflow-hidden transition-all duration-300 shadow-2xl"
      style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(10, 15, 30, 0.98))',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Background ambient glow according to status */}
      <div
        className="absolute -top-24 -right-24 w-60 h-60 rounded-full blur-[90px] pointer-events-none transition-all duration-700"
        style={{
          background:
            currentStatus === 'ACTIVE'
              ? 'rgba(16, 185, 129, 0.25)'
              : currentStatus === 'ON_BREAK'
              ? 'rgba(245, 158, 11, 0.25)'
              : currentStatus === 'SHIFT_ENDED'
              ? 'rgba(99, 102, 241, 0.2)'
              : 'rgba(6, 182, 212, 0.15)',
        }}
      />

      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Today&apos;s Shift Tracker
          </h2>
          {outletName && (
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              {outletName}
            </p>
          )}
        </div>

        {/* Dynamic Status Badge */}
        <div>
          {currentStatus === 'ACTIVE' && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              ACTIVE WORK SHIFT
            </div>
          )}
          {currentStatus === 'ON_BREAK' && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Pause className="w-3.5 h-3.5 animate-pulse" />
              ON BREAK (AUTO GEOFENCED)
            </div>
          )}
          {currentStatus === 'SHIFT_ENDED' && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              SHIFT COMPLETED
            </div>
          )}
          {currentStatus === 'NOT_STARTED' && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
              NOT CLOCKED IN
            </div>
          )}
        </div>
      </div>

      {/* Main 3 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10 mb-6">
        {/* Clock In Time */}
        <div
          className="rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clock In Time</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Play className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight font-mono">
            {clockInTimeStr}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Shift Start</p>
        </div>

        {/* Clock Out Time */}
        <div
          className="rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px]"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Clock Out Time</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
              <LogOut className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-white tracking-tight font-mono">
            {clockOutTimeStr}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Shift End / Status</p>
        </div>

        {/* Live Worked Hours */}
        <div
          className="rounded-2xl p-4 transition-all duration-300 hover:translate-y-[-2px] relative overflow-hidden"
          style={{
            background:
              currentStatus === 'ACTIVE'
                ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))'
                : 'rgba(255, 255, 255, 0.03)',
            border:
              currentStatus === 'ACTIVE'
                ? '1px solid rgba(6, 182, 212, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Hours Worked</span>
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-2xl font-bold text-white tracking-tight">
              {String(hours).padStart(2, '0')}h
            </span>
            <span className="text-2xl font-bold text-cyan-300 tracking-tight">
              {String(minutes).padStart(2, '0')}m
            </span>
            <span className="text-sm font-semibold text-slate-400 tracking-tight">
              {String(seconds).padStart(2, '0')}s
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total Active Work Duration</p>
        </div>
      </div>

      {/* Shift Timeline Logs */}
      {chronologicalLogs.length > 0 && (
        <div className="pt-4 border-t border-white/5 relative z-10">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Today&apos;s Activity Timeline
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {chronologicalLogs.map((log, idx) => {
              const isCheckIn = log.type === 'check_in'
              const isFirst = idx === 0
              const isLast = idx === chronologicalLogs.length - 1

              let label = 'Auto Break Resume'
              if (isCheckIn && isFirst) label = 'Shift Start (Clock In)'
              else if (!isCheckIn && isLast && log.is_final_checkout) label = 'Shift End (Clock Out)'
              else if (!isCheckIn) label = 'Auto Break (Out of Range)'

              return (
                <div
                  key={log.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isCheckIn ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-amber-400'
                      }`}
                    />
                    <span className="font-semibold text-white">{label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-md">
                      {log.distance_from_outlet_meters}m away
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
