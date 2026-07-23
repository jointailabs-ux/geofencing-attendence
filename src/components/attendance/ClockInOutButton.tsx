'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { calculateDistance } from '@/lib/utils'
import { MapPin, Loader2, CheckCircle2, AlertTriangle, Fingerprint, Play, LogOut, Coffee, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import * as Dialog from '@radix-ui/react-dialog'
import type { AttendanceLog } from '@/lib/types/database'

interface ClockInOutButtonProps {
  outlet: {
    name: string
    latitude: number
    longitude: number
    radius_meters: number
    buffer_meters: number
  } | null
  todayLogs: AttendanceLog[]
}

export function ClockInOutButton({ outlet, todayLogs }: ClockInOutButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [liveDistance, setLiveDistance] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)

  // Confirmation Modals State
  const [showStartModal, setShowStartModal] = useState(false)
  const [showEndModal, setShowEndModal] = useState(false)

  const isAutoBreakProcessing = useRef(false)
  const isAutoResumeProcessing = useRef(false)
  const livePosRef = useRef<{ lat: number; lng: number; acc: number } | null>(null)

  // Sort today's logs chronologically
  const chronologicalLogs = [...todayLogs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
  const lastLog = chronologicalLogs.length > 0 ? chronologicalLogs[chronologicalLogs.length - 1] : null

  // Shift state determination
  const hasStartedShift = chronologicalLogs.some((l) => l.type === 'check_in')
  const isActiveShift = lastLog?.type === 'check_in'

  // Shift is final completed if user clicked "End Shift for the Day"
  const isShiftCompletedForDay =
    lastLog?.type === 'check_out' &&
    (lastLog.override_reason === 'FINAL_SHIFT_END' || (lastLog as { is_final_checkout?: boolean }).is_final_checkout === true)

  // On break ONLY if employee started shift, last log is check_out, AND employee has NOT explicitly ended shift for the day
  const isOnBreak = hasStartedShift && lastLog?.type === 'check_out' && !isShiftCompletedForDay

  const isWithinGeofence =
    liveDistance !== null && outlet !== null && liveDistance <= outlet.radius_meters + outlet.buffer_meters

  // Watch position and execute automatic break / auto resume logic
  useEffect(() => {
    if (!outlet || isShiftCompletedForDay) return

    let watchId: number

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          setGeoError(null)
          const lat = pos.coords.latitude
          const lng = pos.coords.longitude
          const acc = pos.coords.accuracy

          livePosRef.current = { lat, lng, acc }
          const dist = Math.round(calculateDistance(lat, lng, outlet.latitude, outlet.longitude))
          setLiveDistance(dist)

          const maxAllowed = outlet.radius_meters + outlet.buffer_meters

          // 1. AUTOMATIC BREAK TRIGGER: If active in shift and stepped OUT of range
          if (isActiveShift && dist > maxAllowed && !isAutoBreakProcessing.current) {
            isAutoBreakProcessing.current = true
            try {
              const res = await fetch('/api/attendance/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude: lat,
                  longitude: lng,
                  accuracy: acc,
                  is_auto_break: true,
                }),
              })

              if (res.ok) {
                toast.warning(
                  <div className="flex flex-col gap-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-400">
                      <Coffee className="w-4 h-4" /> Auto Break Triggered
                    </p>
                    <p className="text-xs text-slate-200">
                      You stepped outside geofence ({dist}m away). Automatically switched to Break time.
                    </p>
                  </div>,
                  { duration: 6000 }
                )
                router.refresh()
              }
            } catch {
              // Ignore failure to allow retry
            } finally {
              setTimeout(() => {
                isAutoBreakProcessing.current = false
              }, 4000)
            }
          }

          // 2. AUTOMATIC RESUME TRIGGER: ONLY if on Mid-Day Break and returned INSIDE range (NOT if shift ended!)
          if (isOnBreak && dist <= maxAllowed && !isAutoResumeProcessing.current) {
            isAutoResumeProcessing.current = true
            try {
              const res = await fetch('/api/attendance/checkin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude: lat,
                  longitude: lng,
                  accuracy: acc,
                  is_break_resume: true,
                }),
              })

              if (res.ok) {
                toast.success(
                  <div className="flex flex-col gap-1">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" /> Resumed Active Shift
                    </p>
                    <p className="text-xs text-slate-200">
                      Welcome back inside range ({dist}m). Automatically clocked back in from Break.
                    </p>
                  </div>,
                  { duration: 6000 }
                )
                router.refresh()
              }
            } catch {
              // Ignore failure
            } finally {
              setTimeout(() => {
                isAutoResumeProcessing.current = false
              }, 4000)
            }
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setGeoError('Location permission denied. Please enable GPS in browser.')
          } else {
            setGeoError(null)
          }
        },
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 8000 }
      )
    } else {
      setGeoError('Geolocation is not supported by your browser.')
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [outlet, isActiveShift, isOnBreak, isShiftCompletedForDay, router])

  // Open appropriate confirmation modal on main button click
  function handleMainButtonClick() {
    if (!outlet) {
      toast.error('No outlet assigned. Contact your manager.')
      return
    }

    const isStartingShift = !hasStartedShift || isShiftCompletedForDay || (!isActiveShift && !isOnBreak)

    if (isStartingShift) {
      if (liveDistance !== null && liveDistance > outlet.radius_meters + outlet.buffer_meters) {
        toast.error(
          `You are ${liveDistance}m away. You must be within ${
            outlet.radius_meters + outlet.buffer_meters
          }m to start shift.`
        )
        return
      }
      setShowStartModal(true)
    } else {
      setShowEndModal(true)
    }
  }

  // Execute API submission after popup confirmation
  async function executeClockSubmission(isStartingShift: boolean) {
    setShowStartModal(false)
    setShowEndModal(false)

    if (!outlet) return

    setIsLoading(true)
    setGeoError(null)

    const targetApi = isStartingShift ? '/api/attendance/checkin' : '/api/attendance/checkout'
    const actionName = isStartingShift ? 'Start Work Shift' : 'End Work Shift'

    const submitWithCoords = async (lat: number, lng: number, acc: number) => {
      try {
        const res = await fetch(targetApi, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
            accuracy: acc,
            is_final_checkout: !isStartingShift,
          }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data.error || `Failed to ${actionName}`)
        }

        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-semibold text-white">{actionName} Successful!</p>
            <p className="text-xs text-slate-300">
              Recorded at {outlet.name} ({data.distance ?? liveDistance ?? 0}m range).
            </p>
          </div>,
          { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> }
        )

        router.refresh()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    if (livePosRef.current) {
      await submitWithCoords(livePosRef.current.lat, livePosRef.current.lng, livePosRef.current.acc)
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => submitWithCoords(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        () => submitWithCoords(outlet.latitude, outlet.longitude, 20),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
      )
    } else {
      submitWithCoords(outlet.latitude, outlet.longitude, 20)
    }
  }

  if (!outlet) {
    return (
      <div className="p-8 rounded-3xl bg-slate-900/60 border border-white/5 text-center text-slate-400">
        You are not assigned to any outlet yet. Contact your manager.
      </div>
    )
  }

  const isStartingShift = !hasStartedShift || isShiftCompletedForDay || (!isActiveShift && !isOnBreak)

  const buttonGradient = isShiftCompletedForDay
    ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
    : isStartingShift
    ? 'linear-gradient(135deg, #10B981, #06B6D4)'
    : 'linear-gradient(135deg, #F43F5E, #E11D48)'

  const ringColor = isShiftCompletedForDay
    ? 'rgba(99, 102, 241, 0.25)'
    : isStartingShift
    ? 'rgba(16, 185, 129, 0.25)'
    : 'rgba(244, 63, 94, 0.25)'

  const glowColor = isShiftCompletedForDay
    ? '0 0 50px rgba(99, 102, 241, 0.35)'
    : isStartingShift
    ? '0 0 50px rgba(16, 185, 129, 0.35), 0 0 100px rgba(6, 182, 212, 0.2)'
    : '0 0 50px rgba(244, 63, 94, 0.35), 0 0 100px rgba(225, 29, 72, 0.2)'

  const isDisabled = isLoading || (isStartingShift && !isWithinGeofence && liveDistance !== null)

  return (
    <>
      <div
        className="flex flex-col items-center justify-center p-8 rounded-3xl relative overflow-hidden transition-all"
        style={{
          background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.9), rgba(10, 15, 30, 0.95))',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.3)',
        }}
      >
        {/* Outlet & Geofence Indicator */}
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold text-white mb-2 tracking-tight">{outlet.name}</h2>

          {geoError ? (
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#f87171',
              }}
            >
              <AlertTriangle className="w-4 h-4" />
              {geoError}
            </div>
          ) : liveDistance !== null ? (
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              style={{
                background: isWithinGeofence ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: `1px solid ${isWithinGeofence ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)'}`,
                color: isWithinGeofence ? '#34d399' : '#f87171',
              }}
            >
              <MapPin className="w-4 h-4" />
              {liveDistance}m away
              <span className="text-slate-400 font-normal ml-1">
                (max allowed {outlet.radius_meters + outlet.buffer_meters}m)
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 text-slate-400 text-xs font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
              Acquiring GPS location...
            </div>
          )}
        </div>

        {/* Main Action Button */}
        <div className="relative my-2">
          {!isDisabled && (
            <>
              <div
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{
                  background: ringColor,
                  transform: 'scale(1.3)',
                  filter: 'blur(10px)',
                }}
              />
              <div
                className="absolute inset-0 rounded-full animate-pulse-ring"
                style={{
                  background: ringColor,
                  transform: 'scale(1.15)',
                  filter: 'blur(5px)',
                  animationDelay: '0.5s',
                }}
              />
            </>
          )}

          <button
            onClick={handleMainButtonClick}
            disabled={isDisabled}
            className="relative flex flex-col items-center justify-center w-48 h-48 rounded-full transition-all duration-300 group"
            style={{
              background: isDisabled ? 'rgba(30, 41, 59, 0.8)' : buttonGradient,
              boxShadow: isDisabled ? 'none' : glowColor,
              border: isDisabled ? '3px solid rgba(71, 85, 105, 0.3)' : '3px solid rgba(255, 255, 255, 0.2)',
              opacity: isDisabled ? 0.6 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={(e) => {
              if (!isDisabled) (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'
            }}
            onMouseLeave={(e) => {
              if (!isDisabled) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'
            }}
          >
            {/* Inner Spinning Ring */}
            <div
              className="absolute inset-2 rounded-full border-2 border-white/20 border-dashed"
              style={{ animation: 'spin 25s linear infinite' }}
            />

            {isLoading ? (
              <Loader2 className="w-12 h-12 text-white animate-spin mb-2" />
            ) : isShiftCompletedForDay ? (
              <ShieldCheck className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />
            ) : isStartingShift ? (
              <Play className="w-12 h-12 text-white mb-2 ml-1 transition-transform group-hover:scale-110" />
            ) : (
              <LogOut className="w-12 h-12 text-white mb-2 transition-transform group-hover:scale-110" />
            )}

            <span className="text-white font-bold tracking-wider uppercase text-xs font-sans text-center px-4">
              {isLoading
                ? 'Locating...'
                : isShiftCompletedForDay
                ? 'Start New Shift'
                : isStartingShift
                ? 'Start Work'
                : 'End Shift'}
            </span>
          </button>
        </div>

        {/* Status Help note */}
        <p className="mt-6 text-xs text-slate-400 text-center max-w-xs leading-relaxed">
          {isShiftCompletedForDay ? (
            <span className="text-indigo-300 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Your shift is completed for today. Automatic location auto-clock is paused.
            </span>
          ) : isStartingShift ? (
            'Click Start Work to begin your shift. A confirmation popup will appear.'
          ) : (
            <span className="flex items-center justify-center gap-1 text-slate-300">
              <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
              Shift active: moving outside range triggers auto break. Click End Shift to finalize day.
            </span>
          )}
        </p>
      </div>

      {/* Start Work Confirmation Modal */}
      <Dialog.Root open={showStartModal} onOpenChange={setShowStartModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl shadow-[0_0_50px_rgba(16,185,129,0.25)] z-50 p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                <Play className="w-6 h-6 text-emerald-400 ml-0.5" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-white">
                  Start Your Work Shift?
                </Dialog.Title>
                <p className="text-xs text-emerald-400 font-semibold mt-0.5">Location: {outlet.name}</p>
              </div>
            </div>

            <Dialog.Description className="text-sm text-slate-300 mb-6 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              You are <span className="font-bold text-white font-mono">{liveDistance ?? 0}m</span> from{' '}
              <span className="font-bold text-white">{outlet.name}</span>.
              <br />
              <br />
              Clicking <strong>Confirm & Start Work</strong> will start your official work shift timer. Automatic location tracking will handle your mid-day breaks when moving in/out of range.
            </Dialog.Description>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeClockSubmission(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-[1.02]"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirm & Start Work
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* End Shift Confirmation Modal */}
      <Dialog.Root open={showEndModal} onOpenChange={setShowEndModal}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 animate-fade-in" />
          <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.25)] z-50 p-6 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                <LogOut className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-white">
                  End Shift for Today?
                </Dialog.Title>
                <p className="text-xs text-rose-400 font-semibold mt-0.5">Final Shift Clock-Out</p>
              </div>
            </div>

            <Dialog.Description className="text-sm text-slate-300 mb-6 leading-relaxed bg-white/[0.02] p-4 rounded-2xl border border-white/5">
              Are you sure you want to <strong>end your shift for the day</strong>?
              <br />
              <br />
              This will record your final clock-out time and complete your workday attendance. You will <strong>NOT</strong> be automatically re-clocked in even if you remain inside the outlet radius.
            </Dialog.Description>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => executeClockSubmission(false)}
                className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] hover:scale-[1.02]"
              >
                <ShieldCheck className="w-4 h-4" />
                Confirm & End Shift
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
