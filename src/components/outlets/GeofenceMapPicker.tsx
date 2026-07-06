'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Target } from 'lucide-react'

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
  const [isLoaded, setIsLoaded] = useState(false)
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : null
  )
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [clickHint, setClickHint] = useState(true)

  // Dynamically import Leaflet (SSR safe)
  useEffect(() => {
    if (typeof window === 'undefined' || mapInstanceRef.current) return

    async function initMap() {
      const L = (await import('leaflet')).default

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const defaultCenter: [number, number] =
        initialLat && initialLng ? [initialLat, initialLng] : [20.5937, 78.9629] // India center

      const map = L.map(mapRef.current!, {
        center: defaultCenter,
        zoom: initialLat ? 16 : 5,
        zoomControl: true,
        attributionControl: true,
      })

      // OpenStreetMap tiles — no API key needed
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      mapInstanceRef.current = map

      // Custom marker icon
      const customIcon = L.divIcon({
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

        // Draggable marker handler
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

  async function reverseGeocode(lat: number, lng: number) {
    setIsGeocoding(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'GeoAttend/1.0',
          },
        }
      )
      const data = await response.json()
      const address = data.display_name as string
      onLocationChange(lat, lng, address)
    } catch {
      onLocationChange(lat, lng)
    } finally {
      setIsGeocoding(false)
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation || !mapInstanceRef.current) return
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude

      mapInstanceRef.current.setView([lat, lng], 17)
      // Simulate a map click
      const L = (await import('leaflet')).default
      mapInstanceRef.current.fire('click', {
        latlng: L.latLng(lat, lng),
      })
    })
  }


  return (
    <div className="space-y-3">
      <div className="relative">
        {/* Map container */}
        <div
          ref={mapRef}
          className="w-full h-72 rounded-xl overflow-hidden border border-[#334155]"
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

        {/* Locate me button */}
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

      {/* Coordinates display */}
      {coords && (
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155]">
          <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
          <span>
            {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
          </span>
          {isGeocoding && (
            <span className="ml-1 text-slate-600 animate-pulse">· Geocoding…</span>
          )}
        </div>
      )}

      {!isLoaded && (
        <p className="text-xs text-slate-500">
          Map loads OpenStreetMap tiles — no API key required.
        </p>
      )}
    </div>
  )
}
