'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { RefreshCw, Battery, Wifi, MapPin, Clock, Signal } from 'lucide-react'
import { cn, formatISTTime } from '@/lib/utils'

import 'leaflet/dist/leaflet.css'

// Fix Leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

function createColoredIcon(color: string) {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0C6.27 0 0 6.27 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.27 21.73 0 14 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -40],
  })
}

const greenIcon = createColoredIcon('#10B981')
const redIcon = createColoredIcon('#EF4444')
const grayIcon = createColoredIcon('#6B7280')

interface Outlet {
  id: string
  name: string
  latitude: number
  longitude: number
  radius_meters: number
}

interface EmployeePing {
  employee: {
    id: string
    full_name: string
    role: string
    outlet_id: string
    outlets: { name: string; latitude: number; longitude: number; radius_meters: number } | null
  }
  lastPing: {
    latitude: number
    longitude: number
    accuracy: number | null
    battery: number | null
    connection_type: string | null
    velocity: number | null
    is_inside_geofence: boolean
    distance_from_outlet: number | null
    created_at: string
  } | null
}

// Component to refocus/pan map based on selected outlet or fit all markers
function MapRefocuser({
  selectedOutlet,
  outlets,
  data,
}: {
  selectedOutlet: string
  outlets: Outlet[]
  data: EmployeePing[]
}) {
  const map = useMap()

  useEffect(() => {
    if (selectedOutlet === 'all') {
      const positions: [number, number][] = []
      data.forEach(d => {
        if (d.lastPing) positions.push([d.lastPing.latitude, d.lastPing.longitude])
      })
      outlets.forEach(o => positions.push([o.latitude, o.longitude]))

      if (positions.length > 0) {
        const bounds = L.latLngBounds(positions.map(([lat, lng]) => [lat, lng]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 })
      }
    } else {
      const outlet = outlets.find(o => o.id === selectedOutlet)
      if (outlet) {
        map.setView([outlet.latitude, outlet.longitude], 16, { animate: true })
      }
    }
  }, [selectedOutlet, outlets, data, map])

  return null
}

interface LiveTrackingMapProps {
  initialData: EmployeePing[]
  outlets: Outlet[]
  orgId: string
}

export function LiveTrackingMap({ initialData, outlets, orgId }: LiveTrackingMapProps) {
  const [data, setData] = useState<EmployeePing[]>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const refreshData = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch(`/api/tracking/latest?orgId=${orgId}`)
      if (res.ok) {
        const json = await res.json()
        setData(json.data)
        setLastRefresh(new Date())
      }
    } catch {
      // silent fail
    } finally {
      setIsRefreshing(false)
    }
  }, [orgId])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    timerRef.current = setInterval(refreshData, 30000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [refreshData])

  // Filter by selected outlet
  const filtered = selectedOutlet === 'all'
    ? data
    : data.filter(d => d.employee.outlet_id === selectedOutlet)

  // Collect positions for map bounds
  const positions: [number, number][] = []
  filtered.forEach(d => {
    if (d.lastPing) positions.push([d.lastPing.latitude, d.lastPing.longitude])
  })
  outlets.forEach(o => positions.push([o.latitude, o.longitude]))

  // Default center (Kolkata) if no positions
  const defaultCenter: [number, number] = positions.length > 0
    ? positions[0]
    : [22.5726, 88.3639]

  // Stats
  const totalTracked = filtered.filter(d => d.lastPing).length
  const insideCount = filtered.filter(d => d.lastPing?.is_inside_geofence).length
  const outsideCount = totalTracked - insideCount
  const offlineCount = filtered.filter(d => {
    if (!d.lastPing) return true
    const diff = Date.now() - new Date(d.lastPing.created_at).getTime()
    return diff > 10 * 60 * 1000 // 10 minutes no ping = offline
  }).length

  function getTimeSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ${mins % 60}m ago`
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Outlet filter */}
        <select
          value={selectedOutlet}
          onChange={(e) => setSelectedOutlet(e.target.value)}
          className="px-3 py-2 rounded-xl text-sm bg-slate-800/80 text-white border border-white/10 focus:border-violet-500/50 focus:outline-none"
        >
          <option value="all">All Outlets</option>
          {outlets.map(o => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>

        {/* Refresh */}
        <button
          onClick={refreshData}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 hover:bg-violet-500/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>

        <span className="text-xs text-slate-500 ml-auto">
          Last updated: {formatISTTime(lastRefresh)} • Auto-refreshes every 30s
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Tracked', value: totalTracked, color: '#8B5CF6', icon: Signal },
          { label: 'Inside Geofence', value: insideCount, color: '#10B981', icon: MapPin },
          { label: 'Outside Geofence', value: outsideCount, color: '#EF4444', icon: MapPin },
          { label: 'Offline', value: offlineCount, color: '#6B7280', icon: Wifi },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-3 border border-white/5 bg-white/[0.02]"
            style={{ boxShadow: `0 0 20px ${s.color}08` }}>
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl" style={{ height: '500px' }}>
        <MapContainer
          center={defaultCenter}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
          className="z-0"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <MapRefocuser selectedOutlet={selectedOutlet} outlets={outlets} data={data} />

          {/* Outlet geofence circles */}
          {outlets.map(o => (
            <Circle
              key={o.id}
              center={[o.latitude, o.longitude]}
              radius={o.radius_meters}
              pathOptions={{
                color: '#8B5CF6',
                fillColor: '#8B5CF6',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '8 4',
              }}
            >
              <Tooltip
                permanent
                direction="bottom"
                className="!bg-violet-950/90 !text-violet-200 !border-violet-500/20 !text-[9px] !font-bold !px-1.5 !py-0.5 !rounded !shadow-md !backdrop-blur-sm"
              >
                📍 {o.name}
              </Tooltip>
              <Popup>
                <div className="text-sm font-semibold">{o.name}</div>
                <div className="text-xs text-gray-500">Radius: {o.radius_meters}m</div>
              </Popup>
            </Circle>
          ))}

          {/* Employee markers */}
          {filtered.map(d => {
            if (!d.lastPing) return null
            const isOffline = Date.now() - new Date(d.lastPing.created_at).getTime() > 10 * 60 * 1000
            const icon = isOffline
              ? grayIcon
              : d.lastPing.is_inside_geofence
                ? greenIcon
                : redIcon

            return (
              <Marker
                key={d.employee.id}
                position={[d.lastPing.latitude, d.lastPing.longitude]}
                icon={icon}
              >
                <Tooltip
                  permanent
                  direction="top"
                  offset={[0, -32]}
                  className={cn(
                    "!text-[10px] !font-bold !px-2 !py-0.5 !rounded-lg !shadow-lg !backdrop-blur-sm",
                    isOffline
                      ? "!bg-slate-900/95 !text-slate-400 !border-slate-800"
                      : d.lastPing.is_inside_geofence
                        ? "!bg-emerald-950/95 !text-emerald-400 !border-emerald-500/20"
                        : "!bg-red-950/95 !text-red-400 !border-red-500/20"
                  )}
                >
                  {d.employee.full_name}
                </Tooltip>
                <Popup>
                  <div className="min-w-[200px]">
                    <p className="text-sm font-bold text-gray-900">{d.employee.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{d.employee.role.replace('_', ' ')}</p>
                    <hr className="my-1.5" />
                    <div className="space-y-1 text-xs">
                      <p className="flex items-center gap-1">
                        <span className={`inline-block w-2 h-2 rounded-full ${d.lastPing.is_inside_geofence ? 'bg-green-500' : 'bg-red-500'}`} />
                        {d.lastPing.is_inside_geofence ? 'Inside geofence' : 'Outside geofence'}
                      </p>
                      {d.lastPing.distance_from_outlet != null && (
                        <p>📏 {d.lastPing.distance_from_outlet}m from outlet</p>
                      )}
                      {d.lastPing.battery != null && (
                        <p>🔋 Battery: {d.lastPing.battery}%</p>
                      )}
                      <p>⏰ {getTimeSince(d.lastPing.created_at)}</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </div>

      {/* Employee List */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="text-sm font-semibold text-white">Employee Status</h3>
        </div>
        <div className="divide-y divide-white/5">
          {filtered.map(d => {
            const isOffline = !d.lastPing || (Date.now() - new Date(d.lastPing.created_at).getTime() > 10 * 60 * 1000)
            return (
              <div key={d.employee.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                {/* Status dot */}
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  isOffline ? 'bg-gray-500' :
                  d.lastPing?.is_inside_geofence ? 'bg-emerald-500 animate-pulse' :
                  'bg-red-500 animate-pulse'
                }`} />

                {/* Name & outlet */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{d.employee.full_name}</p>
                  <p className="text-[10px] text-slate-500">
                    {d.employee.outlets?.name || 'No outlet'} • {d.employee.role.replace('_', ' ')}
                  </p>
                </div>

                {/* Battery */}
                {d.lastPing?.battery != null && (
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    <Battery className="w-3.5 h-3.5" />
                    {d.lastPing.battery}%
                  </div>
                )}

                {/* Distance */}
                {d.lastPing?.distance_from_outlet != null && (
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    d.lastPing.is_inside_geofence
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-red-500/10 text-red-400'
                  }`}>
                    {d.lastPing.distance_from_outlet}m
                  </div>
                )}

                {/* Last seen */}
                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="w-3 h-3" />
                  {d.lastPing ? getTimeSince(d.lastPing.created_at) : 'Never'}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500 text-sm">
              No employees with tracking data found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
