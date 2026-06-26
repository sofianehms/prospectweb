export type WebsiteStatus = 'none' | 'unreachable' | 'outdated' | 'active' | 'blocked'

export interface Establishment {
  id:          string
  name:        string
  address:     string
  lat:         number
  lng:         number
  type:        string
  phone:       string | null
  website:     string | null
  mapsUrl:     string
  rating:      number | null
  ratingCount: number | null
  websiteStatus: WebsiteStatus
  confidenceScore: number
  alreadySaved?: boolean
}

export interface SearchMeta {
  partial: boolean
  cappedTypes: string[]
  failedTypes: string[]
}

export interface SearchResult {
  center: { lat: number; lng: number }
  radius: number
  summary: {
    total:       number
    none:        number
    unreachable: number
    outdated:    number
    active:      number
    blocked:     number
  }
  meta?: SearchMeta
  establishments: Establishment[]
}

// Calcule la distance en mètres entre deux points (Haversine)
export function distanceTo(
  from: { lat: number; lng: number },
  to:   { lat: number; lng: number }
): number {
  const R = 6371000
  const dLat = ((to.lat - from.lat) * Math.PI) / 180
  const dLng = ((to.lng - from.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((from.lat * Math.PI) / 180) *
    Math.cos((to.lat  * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters: number): string {
  return meters < 1000
    ? `${Math.round(meters)} m`
    : `${(meters / 1000).toFixed(1)} km`
}
