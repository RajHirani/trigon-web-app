/** One position report of a vehicle. Times are epoch milliseconds. */
export type PlaybackPoint = {
  t: number
  lat: number
  lng: number
  /** km/h at this report. */
  speed: number
  /** Distance driven since the first point of the route, in km (never decreases). */
  km: number
}

/** The recorded route of one vehicle for a period, oldest point first. Empty `points` = the vehicle did not move. */
export type PlaybackRoute = {
  vehicleId: string
  from: number
  to: number
  points: PlaybackPoint[]
}

/** "Trip settings" in the panel. Changing them re-reads the same route, it is not fetched again. */
export type TripSettings = {
  overSpeedKmh: number
  holdMin: number
}

export const OVER_SPEED_OPTIONS = [40, 60, 80, 100, 120] as const
export const HOLD_OPTIONS = [2, 5, 10, 15, 30] as const
export const DEFAULT_SETTINGS: TripSettings = { overSpeedKmh: 80, holdMin: 5 }

/** A halt that lasted at least the "hold" time. `idx` is the first still point (where the vehicle arrived). */
export type Stop = {
  n: number
  idx: number
  lat: number
  lng: number
  arrivedAt: number
  departedAt: number
  durationMs: number
}

/** A run of points faster than the over-speed limit. `peakIdx` is its fastest point. */
export type OverSpeedEvent = {
  n: number
  startIdx: number
  endIdx: number
  peakIdx: number
  lat: number
  lng: number
  startAt: number
  endAt: number
  maxSpeed: number
}

export type TripAnalysis = {
  distanceKm: number
  maxSpeed: number
  movingMs: number
  stoppedMs: number
  stops: Stop[]
  overSpeed: OverSpeedEvent[]
}

export type RangePreset = 'today' | 'yesterday' | 'week' | 'custom'

/** The period being played back. `to` is "now" for Today / Last 7 days. */
export type PlaybackRange = { preset: RangePreset; from: number; to: number }

/** What the open custom picker currently holds, shown live in the panel's range card. */
export type RangeDraft = { from: number; to: number; tooLong: boolean }

/** The marker whose details card is open on the map. `n` numbers stops and over-speed events; a tapped vehicle has n 0 and the point index `pos` it was tapped at. */
export type MarkerSelection = { kind: 'stop' | 'overSpeed' | 'vehicle'; n: number; pos?: number }
