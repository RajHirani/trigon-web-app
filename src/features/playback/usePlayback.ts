import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { getPlaceName, getPlayback } from '@/services/playback/playbackService'
import type { PlaybackRange } from './types'

/** The recorded route for the period. History does not change, so it is kept for a while and never retried on its own. */
export function usePlayback(vehicleId: string | undefined, range: PlaybackRange) {
  return useQuery({
    queryKey: ['playback', vehicleId, range.from, range.to],
    queryFn: () => getPlayback(vehicleId!, range.from, range.to),
    enabled: !!vehicleId,
    staleTime: 5 * 60_000,
    retry: false,
  })
}

/** Street name of a stop or over-speed point (reverse geocode). */
export function usePlaceName(lat: number | undefined, lng: number | undefined) {
  return useQuery({
    queryKey: ['playback-place', lat, lng],
    queryFn: () => getPlaceName(lat!, lng!),
    enabled: lat !== undefined && lng !== undefined,
    staleTime: Infinity,
    retry: false,
  })
}

export const SPEEDS = [1, 2, 4, 8] as const
export type PlayerSpeed = (typeof SPEEDS)[number]
/** At 1x the whole route plays in this many seconds; 8x is eight times faster. */
export const BASE_SECONDS = 120
const SHOW_EVERY_MS = 50

/**
 * Playback clock. `pos` is a fractional index into the route's points; it advances evenly through the points
 * (so ignition-off gaps are skipped, not waited out) and is published about 20 times a second.
 * Starts playing at 2x whenever a new route arrives.
 */
export function usePlayer(count: number, routeKey: unknown) {
  const [pos, setPos] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<PlayerSpeed>(2)
  const posRef = useRef(0)

  useEffect(() => {
    posRef.current = 0
    setPos(0)
    setPlaying(count > 1)
  }, [count, routeKey])

  useEffect(() => {
    if (!playing || count < 2) return
    const last = count - 1
    const perSecond = (last / BASE_SECONDS) * speed
    let raf = 0
    let prev = performance.now()
    let shown = 0
    const tick = (now: number) => {
      const dt = Math.min(0.25, (now - prev) / 1000)
      prev = now
      const next = Math.min(last, posRef.current + perSecond * dt)
      posRef.current = next
      if (now - shown >= SHOW_EVERY_MS || next >= last) {
        shown = now
        setPos(next)
      }
      if (next >= last) {
        setPlaying(false)
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, speed, count])

  const seek = useCallback(
    (to: number) => {
      const next = Math.min(Math.max(to, 0), Math.max(0, count - 1))
      posRef.current = next
      setPos(next)
    },
    [count],
  )

  const toggle = useCallback(() => {
    if (!playing && posRef.current >= count - 1) seek(0)
    setPlaying((p) => !p)
  }, [playing, count, seek])

  const playFrom = useCallback(
    (idx: number) => {
      seek(idx)
      setPlaying(true)
    },
    [seek],
  )

  const pause = useCallback(() => setPlaying(false), [])

  return { pos, playing, speed, setSpeed, seek, toggle, pause, playFrom }
}
