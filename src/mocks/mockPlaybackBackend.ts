import type { PlaybackPoint, PlaybackRoute } from '@/features/playback/types'
import { addDays, startOfDay } from '@/features/playback/range'
import { mockVehicleBackend } from './mockVehicleBackend'

// Fake route history, used while VITE_USE_MOCK=true. Every day the vehicle drives the same route
// (the Live Track mock's shape, stretched to ~85 km) between 6:12 AM and 11:12 AM with six halts.
// Mock-only switch: add `?playback=empty` or `?playback=error` to the URL to see those states.
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const DAY_START_MIN = 6 * 60 + 12
const DAY_MINUTES = 300
const ROUTE_KM = 84.6
const BASE: [number, number] = [22.98183, 72.594971]
const ROUTE_PX: [number, number][] = [
  [260, 777],
  [640, 697],
  [980, 557],
  [1100, 437],
  [1420, 405],
  [1860, 345],
]

const KM_PER_DEG_LAT = 111.32
const kmPerDegLng = (lat: number) => KM_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180)
const rough: [number, number][] = ROUTE_PX.map(([x, y]) => [BASE[0] - (y - 405) * 0.00003, BASE[1] + (x - 1420) * 0.00004])
const roughKm = rough.slice(1).reduce((s, p, i) => {
  const a = rough[i]!
  return s + Math.hypot((p[0] - a[0]) * KM_PER_DEG_LAT, (p[1] - a[1]) * kmPerDegLng(a[0]))
}, 0)
const SCALE = ROUTE_KM / roughKm
const route: [number, number][] = rough.map(([lat, lng]) => [
  rough[0]![0] + (lat - rough[0]![0]) * SCALE,
  rough[0]![1] + (lng - rough[0]![1]) * SCALE,
])
const segKm = route.slice(1).map((p, i) => {
  const a = route[i]!
  return Math.hypot((p[0] - a[0]) * KM_PER_DEG_LAT, (p[1] - a[1]) * kmPerDegLng(a[0]))
})

/** The route position after driving `km` from its start. */
function positionAt(km: number): [number, number] {
  let left = Math.max(0, km)
  for (let i = 0; i < segKm.length; i++) {
    const len = segKm[i]!
    if (left <= len) {
      const t = len === 0 ? 0 : left / len
      const a = route[i]!
      const b = route[i + 1]!
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
    }
    left -= len
  }
  return route[route.length - 1]!
}

// Halts as [minute into the drive, minutes standing]; none overlap.
const HALTS: [number, number][] = [
  [40, 8],
  [90, 25],
  [150, 12],
  [195, 6],
  [235, 15],
  [275, 7],
]
// Fast spells as [first minute, last minute, km/h before scaling].
const FAST: [number, number, number][] = [
  [58, 62, 106],
  [128, 131, 112],
  [222, 225, 102],
]

/** One day's reports, one per minute, with distances measured from the start of that day's drive. */
function driveDay(dayStart: number, dayIdx: number): PlaybackPoint[] {
  const raw: number[] = []
  for (let i = 0; i <= DAY_MINUTES; i++) {
    if (HALTS.some(([at, dur]) => i >= at && i < at + dur)) {
      raw.push(0)
      continue
    }
    const fast = FAST.find(([a, b]) => i >= a && i <= b)
    raw.push(fast ? fast[2] : Math.max(8, 22 + 12 * Math.sin(i / 6 + dayIdx) + 6 * Math.sin(i / 2.3)))
  }
  const scale = ROUTE_KM / (raw.slice(0, -1).reduce((s, v) => s + v, 0) / 60)
  let km = 0
  return raw.map((r, i) => {
    const [lat, lng] = positionAt(km)
    const point: PlaybackPoint = { t: dayStart + i * 60_000, lat, lng, speed: r * scale, km }
    km += (r * scale) / 60
    return point
  })
}

const PLACES = [
  'SG Highway, Ahmedabad',
  'Sola Bridge, Ahmedabad',
  'Iskcon Cross Road, Ahmedabad',
  'Ashram Road, Ahmedabad',
  'Naroda GIDC, Ahmedabad',
  'Vastral Road, Ahmedabad',
  'Kalol Highway, Gandhinagar',
  'Sardar Patel Ring Road, Ahmedabad',
]

export const mockPlaybackBackend = {
  async get(vehicleId: string, from: number, to: number): Promise<PlaybackRoute> {
    await delay(1100)
    const mode = new URLSearchParams(window.location.search).get('playback')
    if (mode === 'error') throw new Error('Playback failed')
    const vehicle = await mockVehicleBackend.get(vehicleId)
    if (!vehicle) throw new Error('Vehicle not found')
    if (mode === 'empty') return { vehicleId, from, to, points: [] }

    const points: PlaybackPoint[] = []
    let offset = 0
    let dayIdx = 0
    for (let day = startOfDay(from); day <= to; day = addDays(day, 1), dayIdx++) {
      const start = day + DAY_START_MIN * 60_000
      const kept = driveDay(start, dayIdx).filter((p) => p.t >= from && p.t <= to)
      if (kept.length < 10) continue
      const first = kept[0]!.km
      for (const p of kept) points.push({ ...p, km: offset + p.km - first })
      offset += kept[kept.length - 1]!.km - first
    }
    return { vehicleId, from, to, points }
  },

  /** Stands in for reverse geocoding. */
  async place(lat: number, lng: number): Promise<string> {
    await delay(350)
    return PLACES[Math.abs(Math.round(lat * 1000) + Math.round(lng * 1000)) % PLACES.length]!
  },
}
