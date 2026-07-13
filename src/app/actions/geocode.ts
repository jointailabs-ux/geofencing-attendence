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

export type GeocodeProvider = 'locationiq' | 'nominatim'

export interface ProviderState {
  provider: GeocodeProvider
  label: string
}

// ─── Provider Detection ────────────────────────────────────────────────────────

export async function getGeocodeProviderState(): Promise<ProviderState> {
  const locationiqKey = process.env.LOCATIONIQ_API_KEY
  if (locationiqKey) {
    return { provider: 'locationiq', label: 'LocationIQ' }
  }
  return { provider: 'nominatim', label: 'OpenStreetMap' }
}

// ─── Unified Search (Forward Geocoding) ───────────────────────────────────────

/**
 * Search for an address/place by query string.
 * Uses LocationIQ if LOCATIONIQ_API_KEY is set (more accurate).
 * Falls back to Nominatim (OpenStreetMap, completely free, no API key needed).
 * Results are always biased to India (countrycodes=in).
 */
export async function searchAddress(query: string): Promise<GeocodeResponse> {
  const locationiqKey = process.env.LOCATIONIQ_API_KEY

  if (locationiqKey) {
    return searchViaLocationIQ(query, locationiqKey)
  }
  return searchViaNominatim(query)
}

async function searchViaLocationIQ(query: string, key: string): Promise<GeocodeResponse> {
  try {
    // LocationIQ search biased to India
    const url = `https://us1.locationiq.com/v1/search?key=${key}&q=${encodeURIComponent(query)}&format=json&countrycodes=in&addressdetails=1&limit=7`
    const response = await fetch(url, { next: { revalidate: 3600 } })

    if (!response.ok) {
      const errText = await response.text()
      console.warn('LocationIQ search failed:', response.status, errText)
      // Fall back to Nominatim on failure
      return searchViaNominatim(query)
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      // Try without country restriction if no India results
      return searchViaNominatim(query)
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: GeocodeResult[] = data.map((item: any) => ({
      display_name: item.display_name as string,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }))

    return { results }
  } catch (error) {
    console.error('LocationIQ search exception:', error)
    return searchViaNominatim(query)
  }
}

async function searchViaNominatim(query: string): Promise<GeocodeResponse> {
  try {
    // Nominatim search — free, no key needed. Biased to India.
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&countrycodes=in&addressdetails=1&limit=7&accept-language=en`
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'GeoAttend/1.0 (contact@geoattend.app)',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return { error: `Nominatim search failed: ${response.status}` }
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return { results: [] }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: GeocodeResult[] = data.map((item: any) => ({
      display_name: item.display_name as string,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    }))

    return { results }
  } catch (error) {
    const err = error as Error
    console.error('Nominatim search exception:', err)
    return { error: err.message || 'Search failed' }
  }
}

// ─── Unified Reverse Geocode ───────────────────────────────────────────────────

/**
 * Reverse geocode lat/lng to a human-readable address.
 * Uses LocationIQ if LOCATIONIQ_API_KEY is set.
 * Falls back to Nominatim (completely free, no key needed).
 */
export async function reverseGeocodeAddress(lat: number, lng: number): Promise<{ address?: string; error?: string }> {
  const locationiqKey = process.env.LOCATIONIQ_API_KEY

  if (locationiqKey) {
    return reverseViaLocationIQ(lat, lng, locationiqKey)
  }
  return reverseViaNominatim(lat, lng)
}

async function reverseViaLocationIQ(lat: number, lng: number, key: string): Promise<{ address?: string; error?: string }> {
  try {
    const url = `https://us1.locationiq.com/v1/reverse?key=${key}&lat=${lat}&lon=${lng}&format=json`
    const response = await fetch(url, { next: { revalidate: 3600 } })

    if (!response.ok) {
      console.warn('LocationIQ reverse geocode failed:', response.status)
      return reverseViaNominatim(lat, lng)
    }

    const data = await response.json()

    if (data.display_name) {
      return { address: data.display_name as string }
    }
    return reverseViaNominatim(lat, lng)
  } catch (error) {
    console.error('LocationIQ reverse exception:', error)
    return reverseViaNominatim(lat, lng)
  }
}

async function reverseViaNominatim(lat: number, lng: number): Promise<{ address?: string; error?: string }> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=en`
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'GeoAttend/1.0 (contact@geoattend.app)',
      },
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      return { error: `Nominatim reverse geocode failed: ${response.status}` }
    }

    const data = await response.json()

    if (data.display_name) {
      return { address: data.display_name as string }
    }
    return { error: 'No address found for these coordinates' }
  } catch (error) {
    const err = error as Error
    console.error('Nominatim reverse exception:', err)
    return { error: err.message || 'Reverse geocoding failed' }
  }
}

// ─── Legacy exports (kept for backward compatibility) ─────────────────────────

export async function searchGooglePlaces(query: string): Promise<GeocodeResponse> {
  // Route through unified search
  return searchAddress(query)
}

export async function reverseGeocodeGoogle(lat: number, lng: number): Promise<{ address?: string; error?: string }> {
  // Route through unified reverse geocode
  return reverseGeocodeAddress(lat, lng)
}

export async function isGoogleMapsConfigured(): Promise<boolean> {
  // Now returns true if ANY premium provider is configured
  return !!(process.env.LOCATIONIQ_API_KEY || process.env.GOOGLE_MAPS_API_KEY)
}
