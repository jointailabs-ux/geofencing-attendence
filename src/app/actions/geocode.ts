'use server'

interface GeocodeResult {
  display_name: string
  lat: number
  lon: number
}

interface GeocodeResponse {
  results?: GeocodeResult[]
  error?: string
}

interface GoogleGeocodeItem {
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
}

export async function searchGooglePlaces(query: string): Promise<GeocodeResponse> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return { error: 'GOOGLE_MAPS_API_KEY is not configured' }
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      query
    )}&key=${apiKey}`

    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache results for 1 hour to save API costs
    })
    const data = await response.json()

    if (data.status === 'OK' && data.results) {
      const results = data.results.map((item: GoogleGeocodeItem) => ({
        display_name: item.formatted_address,
        lat: item.geometry.location.lat,
        lon: item.geometry.location.lng,
      }))
      return { results }
    } else if (data.status === 'ZERO_RESULTS') {
      return { results: [] }
    } else {
      console.warn(`Google Geocoding API status: ${data.status}`, data.error_message)
      return { error: data.error_message || `Google Geocoding failed: ${data.status}` }
    }
  } catch (error) {
    const err = error as Error
    console.error('Google Geocoding Exception:', err)
    return { error: err.message || 'An unexpected error occurred during Google Geocoding' }
  }
}
