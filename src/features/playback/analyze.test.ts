import { describe, expect, it } from 'vitest'
import { analyzeTrip, sampleAt } from './analyze'
import type { PlaybackPoint } from './types'

const MIN = 60_000
const T0 = new Date(2026, 9, 20, 6, 0, 0).getTime()

/** One point per minute from speeds; `km` grows with the speed. */
function route(speeds: number[], startAt = T0): PlaybackPoint[] {
  let km = 0
  return speeds.map((speed, i) => {
    const p = { t: startAt + i * MIN, lat: 22.9 + i * 0.001, lng: 72.5, speed, km }
    km += speed / 60
    return p
  })
}

const settings = { overSpeedKmh: 80, holdMin: 5 }

describe('analyzeTrip', () => {
  it('is empty for no points', () => {
    expect(analyzeTrip([], settings)).toMatchObject({ distanceKm: 0, stops: [], overSpeed: [] })
  })

  it('finds a stop only when it lasts at least the hold time', () => {
    // minutes 3..8 still (departs at 9 => 6 min), minutes 12..14 still (3 min)
    const pts = route([30, 30, 30, 0, 0, 0, 0, 0, 0, 30, 30, 30, 0, 0, 0, 30])
    const a = analyzeTrip(pts, settings)
    expect(a.stops).toHaveLength(1)
    expect(a.stops[0]).toMatchObject({ n: 1, idx: 3, durationMs: 6 * MIN })
    expect(analyzeTrip(pts, { ...settings, holdMin: 2 }).stops).toHaveLength(2)
    expect(analyzeTrip(pts, { ...settings, holdMin: 10 }).stops).toHaveLength(0)
  })

  it('numbers stops in order and keeps the arrival point', () => {
    const pts = route([20, 0, 0, 0, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 20])
    const a = analyzeTrip(pts, settings)
    expect(a.stops.map((s) => [s.n, s.idx])).toEqual([
      [1, 1],
      [2, 8],
    ])
  })

  it('finds over-speed runs and their fastest point', () => {
    const pts = route([40, 85, 92, 88, 40, 40, 81, 40])
    const a = analyzeTrip(pts, settings)
    expect(a.overSpeed).toHaveLength(2)
    expect(a.overSpeed[0]).toMatchObject({ n: 1, startIdx: 1, endIdx: 3, peakIdx: 2, maxSpeed: 92 })
    expect(a.overSpeed[1]).toMatchObject({ n: 2, startIdx: 6, endIdx: 6 })
    expect(analyzeTrip(pts, { ...settings, overSpeedKmh: 90 }).overSpeed).toHaveLength(1)
  })

  it('closes a run that is still open at the last point', () => {
    const a = analyzeTrip(route([40, 90, 95]), settings)
    expect(a.overSpeed[0]).toMatchObject({ startIdx: 1, endIdx: 2, maxSpeed: 95 })
  })

  it('adds up moving and stopped time and the distance', () => {
    const a = analyzeTrip(route([30, 30, 0, 0, 30]), settings)
    expect(a.movingMs).toBe(2 * MIN + 0) // intervals starting at a moving point: 0->1, 1->2 ... and 4 has no next
    expect(a.stoppedMs).toBe(2 * MIN)
    expect(a.maxSpeed).toBe(30)
    expect(a.distanceKm).toBeCloseTo(1, 5)
  })

  it('does not count a long reporting gap as moving, stopped, or one stop', () => {
    const first = route([30, 0, 0, 0, 0, 0, 30])
    // Same vehicle reports again 3 hours later, standing still
    const second = route([0, 0, 0, 30], T0 + 3 * 3_600_000).map((p) => ({ ...p, km: p.km + 5 }))
    const a = analyzeTrip([...first, ...second], settings)
    expect(a.stops).toHaveLength(1)
    expect(a.stoppedMs).toBeLessThan(10 * MIN)
  })
})

describe('sampleAt', () => {
  const pts = route([30, 30, 0, 0])

  it('returns the point itself on a whole index', () => {
    expect(sampleAt(pts, 1)).toMatchObject({ lat: pts[1]!.lat, speed: 30, km: pts[1]!.km })
  })

  it('interpolates between points', () => {
    const s = sampleAt(pts, 0.5)
    expect(s.lat).toBeCloseTo((pts[0]!.lat + pts[1]!.lat) / 2, 8)
    expect(s.t).toBe(pts[0]!.t + 0.5 * MIN)
  })

  it('clamps outside the route and reports km from the start', () => {
    expect(sampleAt(pts, -3).km).toBe(0)
    expect(sampleAt(pts, 99).lat).toBe(pts[3]!.lat)
  })

  it('heads north when the latitude grows', () => {
    expect(Math.round(sampleAt(pts, 0).heading)).toBe(0)
  })
})
