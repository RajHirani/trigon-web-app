import type { LatLng, LiveTrack, ShareDuration, ShareLink } from '@/features/liveTrack/types'
import { mockVehicleBackend } from './mockVehicleBackend'

// Fake live feed. The vehicle drives along one route (shaped like the Figma path), looping.
// Used while VITE_USE_MOCK=true.
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const BASE: LatLng = [22.98183, 72.594971]
// Route in Figma pixels (x, y), west to east.
const ROUTE_PX: [number, number][] = [
  [260, 777],
  [640, 697],
  [980, 557],
  [1100, 437],
  [1420, 405],
  [1860, 345],
]
const route: LatLng[] = ROUTE_PX.map(([x, y]) => [BASE[0] - (y - 405) * 0.00003, BASE[1] + (x - 1420) * 0.00004])

const KM_PER_DEG_LAT = 111.32
const kmPerDegLng = (lat: number) => 111.32 * Math.cos((lat * Math.PI) / 180)
const segKm = (a: LatLng, b: LatLng) =>
  Math.hypot((b[0] - a[0]) * KM_PER_DEG_LAT, (b[1] - a[1]) * kmPerDegLng(a[0]))
const SEG_KM = route.slice(1).map((p, i) => segKm(route[i]!, p))
const TOTAL_KM = SEG_KM.reduce((s, k) => s + k, 0)

/** Compass bearing from a to b, degrees clockwise from north. */
function bearing(a: LatLng, b: LatLng): number {
  const dy = (b[0] - a[0]) * KM_PER_DEG_LAT
  const dx = (b[1] - a[1]) * kmPerDegLng(a[0])
  return (((Math.atan2(dx, dy) * 180) / Math.PI) + 360) % 360
}

/** Point `km` along the route plus the path up to it and the heading there. */
function pointAt(km: number): { path: LatLng[]; heading: number } {
  let left = km
  const path: LatLng[] = [route[0]!]
  for (let i = 0; i < SEG_KM.length; i++) {
    const len = SEG_KM[i]!
    const a = route[i]!
    const b = route[i + 1]!
    if (left <= len) {
      const t = len === 0 ? 0 : left / len
      path.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
      return { path, heading: bearing(a, b) }
    }
    left -= len
    path.push(b)
  }
  return { path, heading: bearing(route[route.length - 2]!, route[route.length - 1]!) }
}

const T0 = Date.now()
const shares = new Map<string, ShareLink>()
const HOURS: Record<Exclude<ShareDuration, 'custom'>, number> = { '1h': 1, '6h': 6, '24h': 24 }

const token = () => Array.from({ length: 12 }, () => 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 57)]).join('')

export const mockLiveTrackBackend = {
  async get(vehicleId: string): Promise<LiveTrack> {
    await delay(400)
    const vehicle = await mockVehicleBackend.get(vehicleId)
    if (!vehicle) throw new Error('Vehicle not found')
    const index = Number(vehicleId.replace('v', '')) || 0
    const speed = vehicle.speed
    // Moving vehicles advance with their speed; the rest sit where they stopped.
    const travelled = vehicle.status === 'moving' ? ((Date.now() - T0) / 3_600_000) * (speed ?? 0) : 0
    const startKm = (TOTAL_KM * ((index * 0.173) % 0.8)) + TOTAL_KM * 0.1
    const { path, heading } = pointAt((startKm + travelled) % TOTAL_KM)
    const last = path[path.length - 1]!
    const now = Date.now()
    const updatedAt =
      vehicle.status === 'offline' ? vehicle.lastUpdate : new Date(Math.floor(now / 5000) * 5000).toISOString()
    const pathSince = new Date()
    pathSince.setHours(6, 12, 0, 0)
    return {
      vehicleId,
      lat: last[0],
      lng: last[1],
      headingDeg: heading,
      speed,
      updatedAt,
      pathSince: pathSince.toISOString(),
      path,
    }
  },

  async createShare(vehicleId: string, duration: ShareDuration, customHours = 12): Promise<ShareLink> {
    await delay(500)
    const hours = duration === 'custom' ? customHours : HOURS[duration]
    const link: ShareLink = {
      url: `https://track.trigon.app/s/${shares.get(vehicleId)?.url.split('/').pop() ?? token()}`,
      expiresAt: new Date(Date.now() + hours * 3_600_000).toISOString(),
    }
    shares.set(vehicleId, link)
    return link
  },

  async stopShare(vehicleId: string): Promise<void> {
    await delay(400)
    shares.delete(vehicleId)
  },
}
