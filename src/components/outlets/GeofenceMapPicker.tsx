'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Target, Search, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import 'leaflet/dist/leaflet.css'
import { searchAddress, reverseGeocodeAddress, getGeocodeProviderState } from '@/app/actions/geocode'
import type { GeocodeResult, ProviderState } from '@/app/actions/geocode'

interface GeofenceMapPickerProps {
  initialLat?: number
  initialLng?: number
  initialRadius?: number
  onLocationChange: (lat: number, lng: number, address?: string) => void
  onRadiusChange?: (radius: number) => void
  radius: number
}

export function GeofenceMapPicker({
  initialLat,
  initialLng,
  initialRadius = 100,
  onLocationChange,
  radius,
}: GeofenceMapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const circleRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null)

  const [isLoaded, setIsLoaded] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [clickHint, setClickHint] = useState(true)
  const [providerState, setProviderState] = useState<ProviderState | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeocodeResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Detect geocoding provider on mount
  useEffect(() => {
    getGeocodeProviderState().then(setProviderState)
  }, [])

  // Dynamically import Leaflet (SSR safe)
  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default
      LRef.current = L

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      // Default to West Bengal center if no existing location
      const defaultCenter: [number, number] =
        initialLat && initialLng
          ? [initialLat, initialLng]
          : [22.9868, 87.855] // West Bengal center

      const map = L.map(mapRef.current!, {
        center: defaultCenter,
        zoom: initialLat ? 16 : 8, // Zoom in to show WB districts clearly
        zoomControl: true,
        attributionControl: true,
      })

      // OpenStreetMap tiles — no API key needed
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      const customIcon = makeCustomIcon(L)

      // If we have initial coordinates, add marker + circle
      if (initialLat && initialLng) {
        const marker = L.marker([initialLat, initialLng], {
          icon: customIcon,
          draggable: true,
        }).addTo(map)
        const circle = L.circle([initialLat, initialLng], {
          radius: initialRadius,
          color: '#3B82F6',
          fillColor: '#3B82F6',
          fillOpacity: 0.12,
          weight: 2,
        }).addTo(map)
        markerRef.current = marker
        circleRef.current = circle

        marker.on('dragend', async () => {
          const pos = marker.getLatLng()
          circle.setLatLng(pos)
          setCoords({ lat: pos.lat, lng: pos.lng })
          setClickHint(false)
          await reverseGeocode(pos.lat, pos.lng)
        })
      }

      // Click to set location
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      map.on('click', async (e: any) => {
        const { lat, lng } = e.latlng
        setCoords({ lat, lng })
        setClickHint(false)

        if (!markerRef.current) {
          const marker = L.marker([lat, lng], {
            icon: customIcon,
            draggable: true,
          }).addTo(map)
          const circle = L.circle([lat, lng], {
            radius: radius,
            color: '#3B82F6',
            fillColor: '#3B82F6',
            fillOpacity: 0.12,
            weight: 2,
          }).addTo(map)
          markerRef.current = marker
          circleRef.current = circle

          marker.on('dragend', async () => {
            const pos = marker.getLatLng()
            circle.setLatLng(pos)
            setCoords({ lat: pos.lat, lng: pos.lng })
            await reverseGeocode(pos.lat, pos.lng)
          })
        } else {
          markerRef.current.setLatLng([lat, lng])
          circleRef.current.setLatLng([lat, lng])
        }

        await reverseGeocode(lat, lng)
      })

      setTimeout(() => { map.invalidateSize() }, 200)
      setIsLoaded(true)
    }

    initMap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update circle radius when prop changes
  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radius)
    }
  }, [radius])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function makeCustomIcon(L: any) {
    return L.divIcon({
      html: `<div style="
        width: 32px; height: 32px;
        background: #3B82F6;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      "></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    })
  }

  // Update map, marker, and circle to a new location
  const updateMapLocation = async (lat: number, lng: number, address?: string) => {
    if (!mapInstanceRef.current || !LRef.current) return
    const L = LRef.current
    const map = mapInstanceRef.current

    map.setView([lat, lng], 16)
    setCoords({ lat, lng })
    setClickHint(false)

    const customIcon = makeCustomIcon(L)

    if (!markerRef.current) {
      const marker = L.marker([lat, lng], { icon: customIcon, draggable: true }).addTo(map)
      const circle = L.circle([lat, lng], {
        radius: radius,
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.12,
        weight: 2,
      }).addTo(map)
      markerRef.current = marker
      circleRef.current = circle

      marker.on('dragend', async () => {
        const pos = marker.getLatLng()
        circle.setLatLng(pos)
        setCoords({ lat: pos.lat, lng: pos.lng })
        await reverseGeocode(pos.lat, pos.lng)
      })
    } else {
      markerRef.current.setLatLng([lat, lng])
      circleRef.current.setLatLng([lat, lng])
    }

    if (address) {
      onLocationChange(lat, lng, address)
    } else {
      await reverseGeocode(lat, lng)
    }
  }

  // ─── Search handler ────────────────────────────────────────────────────────────
  async function handleSearch(query: string) {
    if (!query.trim()) return
    setIsSearching(true)
    setSearchResults([])

    try {
      const result = await searchAddress(query)

      if (result.results && result.results.length > 0) {
        setSearchResults(result.results)
      } else if (result.results && result.results.length === 0) {
        toast.error('No locations found in India. Try a different name or spelling.')
      } else {
        toast.error('Search failed. Please try again.')
      }
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Search failed. Please check your connection.')
    } finally {
      setIsSearching(false)
    }
  }

  // ─── Reverse geocode (lat/lng → address) ──────────────────────────────────────
  async function reverseGeocode(lat: number, lng: number) {
    setIsGeocoding(true)
    try {
      const result = await reverseGeocodeAddress(lat, lng)
      if (result.address) {
        onLocationChange(lat, lng, result.address)
      } else {
        onLocationChange(lat, lng)
      }
    } catch {
      onLocationChange(lat, lng)
    } finally {
      setIsGeocoding(false)
    }
  }

  // ─── Locate Me ────────────────────────────────────────────────────────────────
  function handleLocateMe() {
    if (!navigator.geolocation || !mapInstanceRef.current) {
      toast.error('Geolocation is not supported by your browser.')
      return
    }
    toast.info('Retrieving your current location...')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await updateMapLocation(pos.coords.latitude, pos.coords.longitude)
        toast.success('Location retrieved successfully!')
      },
      (error) => {
        console.error(error)
        toast.error('Failed to retrieve location. Please check browser location permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ─── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Provider Status Badge */}
      {providerState && (
        <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${
          providerState.provider === 'locationiq'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
        }`}>
          {providerState.provider === 'locationiq' ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <AlertCircle className="w-3 h-3" />
          )}
          Location service: {providerState.label}
          {providerState.provider === 'nominatim' && (
            <span className="text-blue-500 ml-0.5">(free · India biased)</span>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative z-[1001]">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search area, locality, landmark in West Bengal…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch(searchQuery)
                }
              }}
              className="w-full bg-[#1E293B] border border-[#334155] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleSearch(searchQuery)}
            disabled={isSearching}
            className="bg-accent hover:bg-accent-hover disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {isSearching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Searching
              </>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#1E293B] border border-[#334155] rounded-lg shadow-2xl overflow-hidden max-h-60 overflow-y-auto z-[2000]">
            {searchResults.map((result, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  updateMapLocation(result.lat, result.lon, result.display_name)
                  setSearchResults([])
                  setSearchQuery(result.display_name)
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#334155] border-b border-[#334155] last:border-b-0 transition-colors"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-200 line-clamp-2">{result.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-80 rounded-xl overflow-hidden border border-[#334155]"
          style={{ zIndex: 0 }}
        />

        {/* Loading overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-[#1E293B] rounded-xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading map…</p>
            </div>
          </div>
        )}

        {/* Click hint */}
        {isLoaded && clickHint && !coords && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#334155] rounded-xl px-4 py-3 text-center">
              <MapPin className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-sm font-medium text-white">Click on the map</p>
              <p className="text-xs text-slate-400">to set the geofence center</p>
            </div>
          </div>
        )}

        {/* Locate Me button */}
        {isLoaded && (
          <button
            type="button"
            onClick={handleLocateMe}
            className="absolute top-3 right-3 z-[1000] bg-[#1E293B] border border-[#334155] rounded-lg p-2 text-slate-300 hover:text-white hover:border-accent transition-all shadow-lg"
            title="Use my current location"
          >
            <Target className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Coordinates Display */}
      {coords && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155]">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span>
              Lat: {coords.lat.toFixed(6)}, Lng: {coords.lng.toFixed(6)}
            </span>
          </div>
          {isGeocoding && (
            <span className="text-slate-500 animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Resolving address…
            </span>
          )}
        </div>
      )}
    </div>
  )
}
