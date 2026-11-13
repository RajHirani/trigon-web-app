/** [lat, lng] */
export type LatLng = [number, number]

/** Live position and today's path of one vehicle. Refreshed about every 5 seconds. */
export type LiveTrack = {
  vehicleId: string
  lat: number
  lng: number
  /** Degrees clockwise from north, 0-359. */
  headingDeg: number
  /** km/h; null when there is no reading (offline). */
  speed: number | null
  /** ISO timestamp of the last position fix. */
  updatedAt: string
  /** Start of today's path ("Since 06:12 AM"). ISO. */
  pathSince: string
  /** Today's path, oldest first; the last point is the current position. */
  path: LatLng[]
}

export type ShareDuration = '1h' | '6h' | '24h' | 'custom'

export type ShareLink = {
  url: string
  /** ISO timestamp when the link stops working. */
  expiresAt: string
}

export type MapLayer = 'street' | 'satellite' | 'hybrid'

export const MAP_LAYERS: { value: MapLayer; label: string }[] = [
  { value: 'street', label: 'Map' },
  { value: 'satellite', label: 'Satellite' },
  { value: 'hybrid', label: 'Hybrid' },
]
