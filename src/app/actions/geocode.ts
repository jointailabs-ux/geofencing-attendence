'use server'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeocodeResult {
  display_name: string
  lat: number
  lon: number
}

export interface GeocodeResponse {
  results?: GeocodeResult[]
  error?: string
}

export type GeocodeProvider = 'google' | 'nominatim'

export interface ProviderState {
  provider: GeocodeProvider
  label: string
}

// ─── Provider Detection ────────────────────────────────────────────────────────

export async function getGeocodeProviderState(): Promise<ProviderState> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (googleKey) {
    return { provider: 'google', label: 'Google Maps' }
  }
  return { provider: 'nominatim', label: 'OpenStreetMap' }
}

// ─── Unified Search (Forward Geocoding) ───────────────────────────────────────

/**
 * Search for an address/place by query string.
 * Uses Google Geocoding API if GOOGLE_MAPS_API_KEY is set.
 * Falls back to Nominatim (completely free, no key needed, India-biased).
 */
export async function searchAddress(query: string): Promise<GeocodeResponse> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (googleKey) {
    return searchViaGoogle(query, googleKey)
  }
  return searchViaNominatim(query)
}

async function searchViaGoogle(query: string, key: string): Promise<GeocodeResponse> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&region=in&key=${key}`
    const response = await fetch(url, { next: { revalidate: 3600 } })
    const data = await response.json()

    if (data.status === 'OK' && data.results?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const results: GeocodeResult[] = data.results.map((item: any) => ({
        display_name: item.formatted_address as string,
        lat: item.geometry.location.lat as number,
        lon: item.geometry.location.lng as number,
      }))
      return { results }
    } else if (data.status === 'ZERO_RESULTS') {
      return { results: [] }
    } else {
      console.warn('Google Geocoding failed:', data.status, data.error_message)
      return searchViaNominatim(query)
    }
  } catch (error) {
    console.error('Google Geocoding exception:', error)
    return searchViaNominatim(query)
  }
}

async function searchViaNominatim(query: string): Promise<GeocodeResponse> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&addressdetails=1&limit=7&accept-language=en`
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'GeoAttend/1.0 (contact@geoattend.app)',
      },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return { error: `Nominatim search failed: ${response.status}` }
    const data = await response.json()
    if (!Array.isArray(data) || data.length === 0) return { results: [] }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: GeocodeResult[] = data.map((item: any) => ({
      display_name: item.display_name as string,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }))
    return { results }
  } catch (error) {
    const err = error as Error
    return { error: err.message || 'Search failed' }
  }
}

// ─── Unified Reverse Geocode ───────────────────────────────────────────────────

/**
 * Convert lat/lng coordinates to a human-readable address.
 * Uses Google Reverse Geocoding if GOOGLE_MAPS_API_KEY is set.
 * Falls back to Nominatim.
 */
export async function reverseGeocodeAddress(lat: number, lng: number): Promise<{ address?: string; error?: string }> {
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  if (googleKey) {
    return reverseViaGoogle(lat, lng, googleKey)
  }
  return reverseViaNominatim(lat, lng)
}

async function reverseViaGoogle(lat: number, lng: number, key: string): Promise<{ address?: string; error?: string }> {
  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${key}`
    const response = await fetch(url, { next: { revalidate: 3600 } })
    const data = await response.json()

    if (data.status === 'OK' && data.results?.length > 0) {
      return { address: data.results[0].formatted_address as string }
    }
    console.warn('Google Reverse Geocoding failed:', data.status)
    return reverseViaNominatim(lat, lng)
  } catch (error) {
    console.error('Google Reverse exception:', error)
    return reverseViaNominatim(lat, lng)
  }
}

async function reverseViaNominatim(lat: number, lng: number): Promise<{ address?: string; error?: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
    const response = await fetch(url, {
      headers: { 'Accept-Language': 'en', 'User-Agent': 'GeoAttend/1.0' },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return { error: `Nominatim reverse failed: ${response.status}` }
    const data = await response.json()
    if (data.display_name) return { address: data.display_name as string }
    return { error: 'No address found' }
  } catch (error) {
    const err = error as Error
    return { error: err.message || 'Reverse geocoding failed' }
  }
}

// ─── Legacy exports ────────────────────────────────────────────────────────────

export async function searchGooglePlaces(query: string): Promise<GeocodeResponse> {
  return searchAddress(query)
}

export async function reverseGeocodeGoogle(lat: number, lng: number): Promise<{ address?: string; error?: string }> {
  return reverseGeocodeAddress(lat, lng)
}

export async function isGoogleMapsConfigured(): Promise<boolean> {
  return !!(process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY)
}
