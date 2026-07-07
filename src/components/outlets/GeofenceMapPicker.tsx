'use client'

import { useEffect, useRef, useState } from 'react'
import { MapPin, Target, Search, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import 'leaflet/dist/leaflet.css'

// Helper to construct a beautiful address string from Photon properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPhotonAddress(properties: any) {
  const parts = []
  if (properties.name) parts.push(properties.name)
  if (properties.street) {
    if (properties.housenumber) {
      parts.push(`${properties.housenumber} ${properties.street}`)
    } else {
      parts.push(properties.street)
    }
  }
  const city = properties.city || properties.town || properties.village
  if (city) parts.push(city)
  if (properties.district && properties.district !== city) parts.push(properties.district)
  if (properties.state) parts.push(properties.state)
  if (properties.postcode) parts.push(properties.postcode)
  if (properties.country) parts.push(properties.country)
  return parts.join(', ')
}

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

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<{ display_name: string; lat: string; lon: string }[]>([])
  const [isSearching, setIsSearching] = useState(false)

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

      // Trigger redraw to fix container rendering/misalignment
      setTimeout(() => {
        map.invalidateSize()
      }, 200)

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

  // Helper to update the map, marker, and circle center
  const updateMapLocation = async (lat: number, lng: number, address?: string) => {
    if (!mapInstanceRef.current || !LRef.current) return
    const L = LRef.current
    const map = mapInstanceRef.current

    map.setView([lat, lng], 16)
    setCoords({ lat, lng })
    setClickHint(false)

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

    if (address) {
      onLocationChange(lat, lng, address)
    } else {
      await reverseGeocode(lat, lng)
    }
  }

  // Address Search Handler using Photon API (Komoot)
  async function handleSearch(query: string) {
    if (!query.trim()) return
    setIsSearching(true)

    // Get current map center to bias results toward the visible area
    let biasParams = ''
    if (mapInstanceRef.current) {
      const center = mapInstanceRef.current.getCenter()
      biasParams = `&lat=${center.lat}&lon=${center.lng}`
    }

    try {
      const response = await fetch(
        `https://photon.komoot.io/api?q=${encodeURIComponent(query)}${biasParams}&limit=5`
      )
      const data = await response.json()
      
      if (data && data.features && data.features.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedResults = data.features.map((feature: any) => {
          const coordinates = feature.geometry.coordinates // [lng, lat]
          const address = formatPhotonAddress(feature.properties)
          return {
            display_name: address,
            lat: coordinates[1],
            lon: coordinates[0]
          }
        })
        setSearchResults(formattedResults)
      } else {
        toast.error("No locations found. Try being more specific or check spelling.")
      }
    } catch (error) {
      console.error("Search error:", error)
      toast.error("An error occurred while searching for the location.")
    } finally {
      setIsSearching(false)
    }
  }

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
    if (!navigator.geolocation || !mapInstanceRef.current) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }
    
    toast.info("Retrieving your current location...")
    
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        updateMapLocation(lat, lng)
        toast.success("Location retrieved successfully!")
      },
      (error) => {
        console.error(error)
        toast.error("Failed to retrieve location. Please check browser location permissions.")
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative z-[1001]">
        <div className="flex gap-2">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search address, landmark, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleSearch(searchQuery)
                }
              }}
              className="w-full bg-[#1E293B] border border-[#334155] rounded-lg pl-9 pr-8 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-accent"
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
                  const lat = typeof result.lat === 'string' ? parseFloat(result.lat) : result.lat
                  const lng = typeof result.lon === 'string' ? parseFloat(result.lon) : result.lon
                  updateMapLocation(lat, lng, result.display_name)
                  setSearchResults([])
                  setSearchQuery(result.display_name)
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#334155] border-b border-[#334155] last:border-b-0 text-xs text-slate-200 transition-colors line-clamp-2"
              >
                {result.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        {/* Map container */}
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
        <div className="flex items-center justify-between text-xs font-mono text-slate-400 bg-[#0F172A] rounded-lg px-3 py-2 border border-[#334155]">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-accent flex-shrink-0" />
            <span>
              Latitude: {coords.lat.toFixed(6)}, Longitude: {coords.lng.toFixed(6)}
            </span>
          </div>
          {isGeocoding && (
            <span className="text-slate-500 animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Geocoding…
            </span>
          )}
        </div>
      )}
    </div>
  )
}
