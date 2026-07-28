'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import { 
  RefreshCw, 
  Battery, 
  Wifi, 
  MapPin, 
  Signal, 
  Search, 
  Navigation,
  Eye
} from 'lucide-react'
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
    <svg xmlns="http://www.w3.org/2000/svg" width="34" height="46" viewBox="0 0 34 46">
      <!-- Glow Ring -->
      <ellipse cx="17" cy="42" rx="7" ry="3" fill="black" opacity="0.4" />
      <path d="M17 0C7.58 0 0 7.58 0 17c0 12.75 17 29 17 29s17-16.25 17-29C34 7.58 26.42 0 17 0z" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="17" cy="17" r="7" fill="white"/>
      <circle cx="17" cy="17" r="3" fill="${color}"/>
    </svg>
  `
  return L.divIcon({
    html: svgIcon,
    className: 'custom-marker-icon',
    iconSize: [34, 46],
    iconAnchor: [17, 46],
    popupAnchor: [0, -46],
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
  mapFocusTarget,
}: {
  selectedOutlet: string
  outlets: Outlet[]
  data: EmployeePing[]
  mapFocusTarget: [number, number] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (mapFocusTarget) {
      map.setView(mapFocusTarget, 17, { animate: true, duration: 1.2 })
      return
    }

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
  }, [selectedOutlet, outlets, data, map, mapFocusTarget])

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
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'all' | 'inside' | 'outside' | 'offline'>('all')
  const [mapFocusTarget, setMapFocusTarget] = useState<[number, number] | null>(null)
  
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

  const checkIsOffline = (pingDate: string | null) => {
    if (!pingDate) return true
    const diff = Date.now() - new Date(pingDate).getTime()
    return diff > 10 * 60 * 1000 // 10 minutes offline threshold
  }

  // Filter list by search query, tab, and outlet
  const processedData = useMemo(() => {
    return data.filter((d) => {
      const matchSearch = 
        !searchQuery || 
        d.employee.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.employee.role.toLowerCase().includes(searchQuery.toLowerCase())

      const matchOutlet = selectedOutlet === 'all' || d.employee.outlet_id === selectedOutlet
      
      const isOffline = checkIsOffline(d.lastPing?.created_at || null)
      
      let matchTab = true
      if (activeTab === 'inside') {
        matchTab = !!d.lastPing && d.lastPing.is_inside_geofence && !isOffline
      } else if (activeTab === 'outside') {
        matchTab = !!d.lastPing && !d.lastPing.is_inside_geofence && !isOffline
      } else if (activeTab === 'offline') {
        matchTab = isOffline
      }

      return matchSearch && matchOutlet && matchTab
    })
  }, [data, searchQuery, selectedOutlet, activeTab])

  // Stats calculation
  const totalTracked = data.filter(d => d.lastPing).length
  const insideCount = data.filter(d => d.lastPing && d.lastPing.is_inside_geofence && !checkIsOffline(d.lastPing.created_at)).length
  const outsideCount = data.filter(d => d.lastPing && !d.lastPing.is_inside_geofence && !checkIsOffline(d.lastPing.created_at)).length
  const offlineCount = data.filter(d => checkIsOffline(d.lastPing?.created_at || null)).length

  function getTimeSince(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    return `${hrs}h ${mins % 60}m ago`
  }

  const handleFocusEmployeeOnMap = (lat: number, lng: number) => {
    setMapFocusTarget([lat, lng])
    // Clear focus target after centering to allow re-trigger
    setTimeout(() => setMapFocusTarget(null), 1500)
  }

  // Collect positions for map bounds initialization
  const positions: [number, number][] = []
  processedData.forEach(d => {
    if (d.lastPing) positions.push([d.lastPing.latitude, d.lastPing.longitude])
  })
  outlets.forEach(o => positions.push([o.latitude, o.longitude]))

  const defaultCenter: [number, number] = positions.length > 0
    ? positions[0]
    : [22.5726, 88.3639]

  return (
    <div className="space-y-6">
      
      {/* Interactive Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-xl">
        <div className="flex items-center gap-3">
          {/* Outlet filter */}
          <div className="relative">
            <select
              value={selectedOutlet}
              onChange={(e) => setSelectedOutlet(e.target.value)}
              className="px-4 py-2.5 rounded-2xl text-xs font-semibold bg-slate-800 text-white border border-white/10 focus:border-violet-500/50 focus:outline-none appearance-none cursor-pointer pr-10"
              style={{
                backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2394A3B8\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 1rem center',
                backgroundSize: '1em',
              }}
            >
              <option value="all">All Outlets</option>
              {outlets.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>

          {/* Refresh */}
          <button
            onClick={refreshData}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <span className="text-[11px] text-slate-500 font-semibold font-mono sm:text-right">
          Last updated: {formatISTTime(lastRefresh)} • Auto-refreshes 30s
        </span>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Devices', value: totalTracked - offlineCount, max: totalTracked, color: 'text-violet-400', bg: 'bg-violet-500/10', border: 'border-violet-500/20', icon: Signal },
          { label: 'Inside Geofence', value: insideCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: MapPin },
          { label: 'Outside Range', value: outsideCount, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Navigation },
          { label: 'Devices Offline', value: offlineCount, color: 'text-slate-400', bg: 'bg-slate-500/10', border: 'border-slate-500/20', icon: Wifi },
        ].map(s => (
          <div key={s.label} className={cn("rounded-3xl p-5 border shadow-lg flex items-center justify-between", s.bg, s.border)}>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s.label}</span>
              <p className="text-3xl font-black text-white mt-2 font-mono">
                {s.value}
                {s.max !== undefined && <span className="text-slate-500 text-sm font-normal"> / {s.max}</span>}
              </p>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
              <s.icon className={cn("w-5 h-5", s.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* Split Screen Control Panel and Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Sidebar Status Board */}
        <div className="lg:col-span-4 flex flex-col rounded-3xl border border-white/5 bg-slate-950/40 backdrop-blur-xl overflow-hidden shadow-2xl h-[580px]">
          
          {/* Header Panel search */}
          <div className="p-4 border-b border-white/5 space-y-3 bg-white/[0.01]">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search staff..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all"
              />
            </div>

            {/* Quick Filter tabs */}
            <div className="grid grid-cols-4 gap-1 bg-slate-900 p-1 rounded-xl text-[10px] font-bold">
              {[
                { id: 'all', label: 'All' },
                { id: 'inside', label: 'In' },
                { id: 'outside', label: 'Out' },
                { id: 'offline', label: 'Off' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'all' | 'inside' | 'outside' | 'offline')}
                  className={cn(
                    "py-1.5 rounded-lg text-center transition-all",
                    activeTab === tab.id
                      ? "bg-violet-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* List content */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5 pr-0.5 custom-scrollbar">
            {processedData.map(d => {
              const isOffline = checkIsOffline(d.lastPing?.created_at || null)
              const hasPing = d.lastPing != null
              return (
                <div 
                  key={d.employee.id} 
                  className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.02] transition-all group"
                >
                  {/* Status Ring & Pulse */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-bold text-sm text-white group-hover:border-violet-500/30 transition-all">
                      {d.employee.full_name.charAt(0).toUpperCase()}
                    </div>
                    <span className={cn(
                      "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex-shrink-0",
                      isOffline ? 'bg-slate-500' :
                      d.lastPing?.is_inside_geofence ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' :
                      'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                    )} />
                  </div>

                  {/* Name and info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white group-hover:text-violet-400 transition-colors truncate">
                      {d.employee.full_name}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                      {d.employee.outlets?.name || 'No outlet'} • {d.employee.role.replace('_', ' ')}
                    </p>
                  </div>

                  {/* Focus Action / Details */}
                  <div className="flex items-center gap-3">
                    {/* Status detail */}
                    {hasPing && !isOffline ? (
                      <div className="flex flex-col items-end font-mono text-[10px]">
                        <span className={cn(
                          "font-bold",
                          d.lastPing!.is_inside_geofence ? "text-emerald-400" : "text-red-400"
                        )}>
                          {d.lastPing!.is_inside_geofence ? 'IN' : 'OUT'}
                        </span>
                        {d.lastPing!.battery != null && (
                          <span className="text-[9px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                            <Battery className="w-3 h-3" /> {d.lastPing!.battery}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-800/30 px-1.5 py-0.5 rounded border border-slate-800">
                        OFFLINE
                      </span>
                    )}

                    {/* Quick map click button */}
                    {hasPing && (
                      <button
                        onClick={() => handleFocusEmployeeOnMap(d.lastPing!.latitude, d.lastPing!.longitude)}
                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-violet-600 hover:text-white text-slate-400 hover:border-violet-500 transition-all opacity-0 group-hover:opacity-100"
                        title="Locate on Map"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
            {processedData.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs mt-12">
                No matching active devices found.
              </div>
            )}
          </div>
        </div>

        {/* Right Map Canvas Panel */}
        <div className="lg:col-span-8 rounded-3xl overflow-hidden border border-white/5 shadow-2xl h-[580px] relative z-10">
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
            <MapRefocuser 
              selectedOutlet={selectedOutlet} 
              outlets={outlets} 
              data={data} 
              mapFocusTarget={mapFocusTarget}
            />

            {/* Outlets Geofencing boundaries */}
            {outlets.map(o => (
              <Circle
                key={o.id}
                center={[o.latitude, o.longitude]}
                radius={o.radius_meters}
                pathOptions={{
                  color: '#8B5CF6',
                  fillColor: '#8B5CF6',
                  fillOpacity: 0.05,
                  weight: 2,
                  dashArray: '6 4',
                }}
              >
                <Tooltip
                  permanent
                  direction="bottom"
                  className="!bg-violet-950/90 !text-violet-200 !border-violet-500/20 !text-[9px] !font-bold !px-1.5 !py-0.5 !rounded-lg !shadow-md !backdrop-blur-sm"
                >
                  📍 {o.name}
                </Tooltip>
                <Popup>
                  <div className="text-sm font-semibold">{o.name}</div>
                  <div className="text-xs text-gray-500 font-mono">Radius: {o.radius_meters}m</div>
                </Popup>
              </Circle>
            ))}

            {/* Employee GPS markers */}
            {processedData.map(d => {
              if (!d.lastPing) return null
              const isOffline = checkIsOffline(d.lastPing.created_at)
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
                    offset={[0, -38]}
                    className={cn(
                      "!text-[10px] !font-bold !px-2.5 !py-0.5 !rounded-lg !shadow-lg !backdrop-blur-sm",
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
                      <hr className="my-1.5 border-slate-200" />
                      <div className="space-y-1 text-xs text-slate-700">
                        <p className="flex items-center gap-1.5 font-medium">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                            isOffline ? 'bg-slate-400' :
                            d.lastPing.is_inside_geofence ? 'bg-emerald-500' : 'bg-rose-500'
                          }`} />
                          {isOffline ? 'Offline' : d.lastPing.is_inside_geofence ? 'Inside geofence' : 'Outside range'}
                        </p>
                        {d.lastPing.distance_from_outlet != null && (
                          <p>📏 distance: {d.lastPing.distance_from_outlet}m</p>
                        )}
                        {d.lastPing.battery != null && (
                          <p>🔋 Battery level: {d.lastPing.battery}%</p>
                        )}
                        {d.lastPing.connection_type && (
                          <p>📶 Connection: {d.lastPing.connection_type}</p>
                        )}
                        <p className="text-slate-400 text-[10px] pt-1">Seen: {getTimeSince(d.lastPing.created_at)}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              )
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}
