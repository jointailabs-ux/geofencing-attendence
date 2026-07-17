'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleMap, useLoadScript, Circle, Marker, Autocomplete } from '@react-google-maps/api'
import { MapPin, Target, Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { reverseGeocodeAddress } from '@/app/actions/geocode'

const LIBRARIES: ('places')[] = ['places']

// Default center: West Bengal
const WB_CENTER = { lat: 22.9868, lng: 87.855 }

const MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#64748b' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#1e3a5f' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#93c5fd' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0c1929' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#475569' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#162032' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#0d2818' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#4ade80' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#162032' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#334155' }] },
]

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
  onLocationChange,
  radius,
}: GeofenceMapPickerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
  })

  const mapRef = useRef<google.maps.Map | null>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const [markerPos, setMarkerPos] = useState<google.maps.LatLngLiteral | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [clickHint, setClickHint] = useState(!initialLat)
  const [searchValue, setSearchValue] = useState('')

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map
  }, [])

  // ─── Reverse geocode via server action ─────────────────────────────────────
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setIsGeocoding(true)
    try {
      const result = await reverseGeocodeAddress(lat, lng)
      onLocationChange(lat, lng, result.address)
    } catch {
      onLocationChange(lat, lng)
    } finally {
      setIsGeocoding(false)
    }
  }, [onLocationChange])

  // Resolve address for existing initial coordinates
  useEffect(() => {
    if (initialLat && initialLng) {
      reverseGeocode(initialLat, initialLng)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Google Places Autocomplete place selected ──────────────────────────────
  const onPlaceChanged = useCallback(() => {
    if (!autocompleteRef.current) return
    const place = autocompleteRef.current.getPlace()

    if (!place.geometry?.location) {
      toast.error('No location found for this place. Try a more specific search.')
      return
    }

    const lat = place.geometry.location.lat()
    const lng = place.geometry.location.lng()
    const address = place.formatted_address || place.name || ''

    const pos = { lat, lng }
    setMarkerPos(pos)
    setClickHint(false)
    setSearchValue(address)

    if (mapRef.current) {
      mapRef.current.panTo(pos)
      mapRef.current.setZoom(17)
    }

    onLocationChange(lat, lng, address)
  }, [onLocationChange])

  // ─── Map click ─────────────────────────────────────────────────────────────
  const handleMapClick = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setMarkerPos({ lat, lng })
    setClickHint(false)
    await reverseGeocode(lat, lng)
  }, [reverseGeocode])

  // ─── Marker drag ───────────────────────────────────────────────────────────
  const handleMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setMarkerPos({ lat, lng })
    await reverseGeocode(lat, lng)
  }, [reverseGeocode])

  // ─── Locate Me ─────────────────────────────────────────────────────────────
  function handleLocateMe() {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser.')
      return
    }
    toast.info('Retrieving your current location...')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const position = { lat, lng }
        setMarkerPos(position)
        setClickHint(false)
        if (mapRef.current) {
          mapRef.current.panTo(position)
          mapRef.current.setZoom(17)
        }
        await reverseGeocode(lat, lng)
        toast.success('Location retrieved!')
      },
      () => toast.error('Failed to get location. Check browser permissions.'),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  // ─── Load error ─────────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="flex items-center justify-center h-80 rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 text-sm gap-2">
        <MapPin className="w-4 h-4" />
        Failed to load Google Maps. Check your API key.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Provider Badge */}
      <div className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
        <CheckCircle2 className="w-3 h-3" />
        Powered by Google Maps Places
      </div>

      {/* Google Places Autocomplete Search Bar */}
      <div className="relative z-[1001]">
        {isLoaded ? (
          <Autocomplete
            onLoad={(ac) => { autocompleteRef.current = ac }}
            onPlaceChanged={onPlaceChanged}
            options={{
              // Bias results towards West Bengal — but NOT restricted, so all places appear
              bounds: new google.maps.LatLngBounds(
                { lat: 21.5, lng: 85.8 }, // SW corner of West Bengal
                { lat: 27.2, lng: 89.9 }  // NE corner of West Bengal
              ),
              strictBounds: false,   // Allow results outside the bounds too
              // No types filter — shows establishments, addresses, localities, everything
              fields: ['geometry', 'formatted_address', 'name', 'address_components', 'place_id'],
            }}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Search shop, building, area, road, village, city…"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full bg-[#1E293B] border border-[#334155] rounded-lg pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent"
              />
              <MapPin className="w-4 h-4 text-accent absolute left-3 top-3.5" />
            </div>
          </Autocomplete>
        ) : (
          <div className="relative">
            <input
              type="text"
              placeholder="Loading Google Places search…"
              disabled
              className="w-full bg-[#1E293B] border border-[#334155] rounded-lg pl-9 pr-4 py-2.5 text-sm text-slate-500 placeholder-slate-600"
            />
            <Loader2 className="w-4 h-4 text-slate-500 absolute left-3 top-3.5 animate-spin" />
          </div>
        )}
        <p className="text-xs text-slate-500 mt-1.5 pl-1">
          Search any shop, road, building, village, or locality — all types supported
        </p>
      </div>

      {/* Map Container */}
      <div className="relative">
        {!isLoaded ? (
          <div className="w-full h-80 rounded-xl border border-[#334155] bg-[#1E293B] flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Loading Google Maps…</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-80 rounded-xl overflow-hidden border border-[#334155]">
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={markerPos ?? WB_CENTER}
              zoom={markerPos ? 16 : 8}
              options={{
                styles: MAP_STYLES,
                zoomControl: true,
                mapTypeControl: true,
                streetViewControl: false,
                fullscreenControl: true,
                clickableIcons: false,
                mapTypeControlOptions: {
                  style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                  position: google.maps.ControlPosition.TOP_LEFT,
                },
              }}
              onLoad={onMapLoad}
              onClick={handleMapClick}
            >
              {/* Draggable Marker */}
              {markerPos && (
                <Marker
                  position={markerPos}
                  draggable
                  onDragEnd={handleMarkerDragEnd}
                  icon={{
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 10,
                    fillColor: '#3B82F6',
                    fillOpacity: 1,
                    strokeColor: '#ffffff',
                    strokeWeight: 3,
                  }}
                />
              )}

              {/* Geofence Circle */}
              {markerPos && (
                <Circle
                  center={markerPos}
                  radius={radius}
                  options={{
                    strokeColor: '#3B82F6',
                    strokeOpacity: 0.9,
                    strokeWeight: 2,
                    fillColor: '#3B82F6',
                    fillOpacity: 0.15,
                  }}
                />
              )}
            </GoogleMap>
          </div>
        )}

        {/* Click hint overlay */}
        {isLoaded && clickHint && !markerPos && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#334155] rounded-xl px-4 py-3 text-center">
              <MapPin className="w-5 h-5 text-accent mx-auto mb-1" />
              <p className="text-sm font-medium text-white">Search or click the map</p>
              <p className="text-xs text-slate-400">to pin the geofence center</p>
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
      {markerPos && (
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155]">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span>Lat: {markerPos.lat.toFixed(6)}, Lng: {markerPos.lng.toFixed(6)}</span>
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
