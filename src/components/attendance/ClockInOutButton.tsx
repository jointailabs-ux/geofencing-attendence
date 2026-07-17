'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { calculateDistance } from '@/lib/utils'
import { MapPin, Loader2, CheckCircle2, AlertTriangle, Fingerprint } from 'lucide-react'
import { toast } from 'sonner'
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
  const autoCheckoutTriggered = useRef(false)
  const livePosRef = useRef<{ lat: number; lng: number; acc: number } | null>(null)

  // Determine current status based on today's logs
  const lastLog = todayLogs.length > 0 ? todayLogs[0] : null
  const canClockIn = !lastLog || lastLog.type === 'check_out'
  const actionText = canClockIn ? 'Clock In' : 'Clock Out'
  const apiRoute = canClockIn ? '/api/attendance/checkin' : '/api/attendance/checkout'

  const isWithinGeofence = liveDistance !== null && outlet !== null && liveDistance <= outlet.radius_meters + outlet.buffer_meters

  useEffect(() => {
    if (!outlet) return

    let watchId: number

    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (pos) => {
          setGeoError(null)
          livePosRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }
          const dist = calculateDistance(
            pos.coords.latitude,
            pos.coords.longitude,
            outlet.latitude,
            outlet.longitude
          )
          const roundedDist = Math.round(dist)
          setLiveDistance(roundedDist)

          // Auto-checkout logic
          const maxAllowed = outlet.radius_meters + outlet.buffer_meters
          if (!canClockIn && roundedDist > maxAllowed && !autoCheckoutTriggered.current) {
            autoCheckoutTriggered.current = true
            try {
              const res = await fetch('/api/attendance/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  latitude: pos.coords.latitude,
                  longitude: pos.coords.longitude,
                  accuracy: pos.coords.accuracy,
                }),
              })
              
              if (res.ok) {
                toast.error(
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">Auto Checkout</p>
                    <p className="text-sm opacity-90">
                      You left the geofenced area ({roundedDist}m). You have been automatically checked out.
                    </p>
                  </div>,
                  { duration: 8000 }
                )
                router.refresh()
              } else {
                // If it failed (e.g. rate limit), allow it to trigger again later
                autoCheckoutTriggered.current = false
              }
            } catch {
              autoCheckoutTriggered.current = false
            }
          }
        },
        (err) => {
          if (err.code === err.PERMISSION_DENIED) {
            setGeoError('Location permission denied. Please enable GPS.')
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            setGeoError('Location unavailable. Try moving to a clear area.')
          } else {
            setGeoError('Timeout getting location.')
          }
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      )
    } else {
      setGeoError('Geolocation is not supported by your browser.')
    }

    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId)
      }
    }
  }, [outlet, canClockIn, router])

  async function handleClockAction() {
    if (!outlet) {
      toast.error('No outlet assigned. Contact your manager.')
      return
    }
    
    // Strict Geofence Block for Clock In
    if (canClockIn && liveDistance !== null && liveDistance > outlet.radius_meters + outlet.buffer_meters) {
       toast.error(`You are ${liveDistance}m away. You must be within ${outlet.radius_meters + outlet.buffer_meters}m to clock in.`)
       return
    }

    setIsLoading(true)
    setGeoError(null)

    if (!('geolocation' in navigator)) {
      toast.error('Geolocation is not supported by your browser.')
      setIsLoading(false)
      return
    }

    // Use cached position if available to speed up manual click
    const submitPosition = (pos: { coords: { latitude: number, longitude: number, accuracy: number } }) => {
        fetch(apiRoute, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
            }),
          }).then(async (res) => {
              const data = await res.json()
              if (!res.ok) {
                throw new Error(data.error || 'Failed to submit attendance')
              }
              
              if (data.isWithinGeofence) {
                toast.success(
                  <div className="flex flex-col gap-1">
                    <p className="font-semibold">{actionText} Successful!</p>
                    <p className="text-sm opacity-90">
                      You are {data.distance}m from {outlet.name} (within range).
                    </p>
                  </div>,
                  { icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" /> }
                )
              } else {
                toast.error(`${actionText} recorded outside range (${data.distance}m)`)
              }
              router.refresh()
          }).catch(error => {
              toast.error(error instanceof Error ? error.message : 'An error occurred')
          }).finally(() => {
              setIsLoading(false)
          })
    }

    if (livePosRef.current && livePosRef.current.acc <= 100) {
        submitPosition({ coords: { latitude: livePosRef.current.lat, longitude: livePosRef.current.lng, accuracy: livePosRef.current.acc } })
    } else {
        navigator.geolocation.getCurrentPosition(
            submitPosition,
            (err) => {
              setIsLoading(false)
              if (err.code === err.PERMISSION_DENIED) {
                toast.error('Location permission denied.')
                setGeoError('Location permission denied.')
              } else {
                toast.error('Failed to get your location. Make sure GPS is enabled.')
              }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        )
    }
  }

  if (!outlet) {
    return (
      <div className="geo-card text-center py-8 text-slate-400">
        You are not assigned to any outlet yet.
      </div>
    )
  }

  // Dynamic gradient colors for the button
  const buttonGradient = canClockIn
    ? 'linear-gradient(135deg, #10B981, #06B6D4)'
    : 'linear-gradient(135deg, #F59E0B, #F97316)'
  const ringColor = canClockIn
    ? 'rgba(16, 185, 129, 0.2)'
    : 'rgba(245, 158, 11, 0.2)'
  const glowColor = canClockIn
    ? '0 0 50px rgba(16, 185, 129, 0.3), 0 0 100px rgba(6, 182, 212, 0.15)'
    : '0 0 50px rgba(245, 158, 11, 0.3), 0 0 100px rgba(249, 115, 22, 0.15)'
  const isDisabled = isLoading || !!geoError || (canClockIn && !isWithinGeofence)

  return (
    <div className="flex flex-col items-center justify-center p-6 rounded-2xl relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, rgba(17, 24, 39, 0.8), rgba(10, 15, 30, 0.9))',
        border: '1px solid rgba(139, 92, 246, 0.1)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
      <div className="mb-8 text-center">
        <h2 className="text-lg font-semibold text-white mb-2">{outlet.name}</h2>
        {geoError ? (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
            <AlertTriangle className="w-4 h-4" />
            {geoError}
          </div>
        ) : liveDistance !== null ? (
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: isWithinGeofence ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${isWithinGeofence ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
              color: isWithinGeofence ? '#34d399' : '#f87171',
            }}
          >
            <MapPin className="w-4 h-4" />
            {liveDistance}m away
            <span className="text-slate-400 ml-1 font-normal">
              (max {outlet.radius_meters + outlet.buffer_meters}m)
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Acquiring GPS...
          </div>
        )}
      </div>

      {/* Clock Button with animated rings */}
      <div className="relative">
        {/* Outer pulsing ring */}
        {!isDisabled && (
          <>
            <div className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{
                background: ringColor,
                transform: 'scale(1.3)',
                filter: 'blur(8px)',
              }} />
            <div className="absolute inset-0 rounded-full animate-pulse-ring"
              style={{
                background: ringColor,
                transform: 'scale(1.15)',
                filter: 'blur(4px)',
                animationDelay: '0.5s',
              }} />
          </>
        )}

        <button
          onClick={handleClockAction}
          disabled={isDisabled}
          className="relative flex flex-col items-center justify-center w-44 h-44 rounded-full transition-all duration-300"
          style={{
            background: isDisabled ? 'rgba(30, 41, 59, 0.8)' : buttonGradient,
            boxShadow: isDisabled ? 'none' : glowColor,
            border: isDisabled ? '3px solid rgba(71, 85, 105, 0.3)' : '3px solid rgba(255,255,255,0.15)',
            opacity: isDisabled ? 0.6 : 1,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            transform: isDisabled ? 'scale(1)' : undefined,
          }}
          onMouseEnter={(e) => { if (!isDisabled) (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { if (!isDisabled) (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
        >
          {/* Inner decorative ring */}
          <div className="absolute inset-2 rounded-full border-2 border-white/20 border-dashed"
            style={{ animation: 'spin 20s linear infinite' }} />
          
          {isLoading ? (
            <Loader2 className="w-12 h-12 text-white animate-spin mb-2" />
          ) : (
            <Fingerprint className="w-12 h-12 text-white mb-2 transition-transform duration-300" />
          )}
          
          <span className="text-white font-bold tracking-wider uppercase text-sm">
            {isLoading ? 'Locating...' : actionText}
          </span>
        </button>
      </div>

      {lastLog && (
        <p className="mt-8 text-sm text-slate-400">
          Last recorded: {lastLog.type === 'check_in' ? 'Clocked In' : 'Clocked Out'} at{' '}
          <strong className="text-white">
            {new Date(lastLog.timestamp).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </strong>
        </p>
      )}
    </div>
  )
}
