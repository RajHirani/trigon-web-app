import type { OverSpeedEvent, PlaybackPoint, Stop, TripAnalysis, TripSettings } from './types'

/** Below this the vehicle counts as standing still. */
export const STILL_KMH = 1
/** A pause between two reports longer than this is "no data" (ignition off), not moving and not a stop. */
export const GAP_MS = 15 * 60_000

export const EMPTY_ANALYSIS: TripAnalysis = {
  distanceKm: 0,
  maxSpeed: 0,
  movingMs: 0,
  stoppedMs: 0,
  stops: [],
  overSpeed: [],
}

/** Reads stops, over-speed events and totals from the raw route using the trip settings. */
export function analyzeTrip(points: PlaybackPoint[], { overSpeedKmh, holdMin }: TripSettings): TripAnalysis {
  if (points.length === 0) return EMPTY_ANALYSIS

  let movingMs = 0
  let stoppedMs = 0
  let maxSpeed = 0
  const stops: Stop[] = []
  const overSpeed: OverSpeedEvent[] = []
  let stopStart = -1
  let overStart = -1

  const closeStop = (endIdx: number) => {
    if (stopStart < 0) return
    const a = points[stopStart]!
    const b = points[endIdx]!
    const durationMs = b.t - a.t
    if (durationMs >= holdMin * 60_000) {
      stops.push({ n: stops.length + 1, idx: stopStart, lat: a.lat, lng: a.lng, arrivedAt: a.t, departedAt: b.t, durationMs })
    }
    stopStart = -1
  }

  const closeOver = (endIdx: number) => {
    if (overStart < 0) return
    let peakIdx = overStart
    for (let i = overStart; i <= endIdx; i++) if (points[i]!.speed > points[peakIdx]!.speed) peakIdx = i
    const peak = points[peakIdx]!
    overSpeed.push({
      n: overSpeed.length + 1,
      startIdx: overStart,
      endIdx,
      peakIdx,
      lat: peak.lat,
      lng: peak.lng,
      startAt: points[overStart]!.t,
      endAt: points[endIdx]!.t,
      maxSpeed: peak.speed,
    })
    overStart = -1
  }

  for (let i = 0; i < points.length; i++) {
    const p = points[i]!
    const prev = points[i - 1]
    if (prev) {
      const dt = p.t - prev.t
      if (dt > GAP_MS) {
        closeStop(i - 1)
        closeOver(i - 1)
      } else if (prev.speed < STILL_KMH) stoppedMs += dt
      else movingMs += dt
    }
    if (p.speed > maxSpeed) maxSpeed = p.speed

    if (p.speed < STILL_KMH) {
      if (stopStart < 0) stopStart = i
    } else closeStop(i)

    if (p.speed > overSpeedKmh) {
      if (overStart < 0) overStart = i
    } else closeOver(i - 1)
  }
  closeStop(points.length - 1)
  closeOver(points.length - 1)

  return {
    distanceKm: points[points.length - 1]!.km - points[0]!.km,
    maxSpeed,
    movingMs,
    stoppedMs,
    stops,
    overSpeed,
  }
}

/** Compass bearing from a to b, degrees clockwise from north. */
function bearing(a: PlaybackPoint, b: PlaybackPoint): number {
  const dy = b.lat - a.lat
  const dx = (b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180)
  return (((Math.atan2(dx, dy) * 180) / Math.PI) + 360) % 360
}

export type Sample = { lat: number; lng: number; t: number; speed: number; km: number; heading: number }

/** The vehicle at a fractional point index (0 = first point): positions and values are interpolated between reports. */
export function sampleAt(points: PlaybackPoint[], pos: number): Sample {
  const last = points.length - 1
  const p = Math.min(Math.max(pos, 0), last)
  const i = Math.min(Math.floor(p), last)
  const a = points[i]!
  const b = points[Math.min(i + 1, last)]!
  const f = p - i
  // Heading: towards the next point that actually moved; a halted vehicle keeps its last heading.
  let heading = 0
  for (let j = i; j < Math.min(points.length - 1, i + 12); j++) {
    if (points[j]!.lat !== points[j + 1]!.lat || points[j]!.lng !== points[j + 1]!.lng) {
      heading = bearing(points[j]!, points[j + 1]!)
      break
    }
  }
  if (heading === 0) {
    for (let j = i; j > Math.max(0, i - 12); j--) {
      if (points[j]!.lat !== points[j - 1]!.lat || points[j]!.lng !== points[j - 1]!.lng) {
        heading = bearing(points[j - 1]!, points[j]!)
        break
      }
    }
  }
  const mix = (x: number, y: number) => x + (y - x) * f
  return {
    lat: mix(a.lat, b.lat),
    lng: mix(a.lng, b.lng),
    t: mix(a.t, b.t),
    speed: mix(a.speed, b.speed),
    km: mix(a.km, b.km) - points[0]!.km,
    heading,
  }
}
