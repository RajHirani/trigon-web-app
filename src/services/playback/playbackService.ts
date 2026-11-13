import { env } from '@/config/env'
import type { PlaybackRoute } from '@/features/playback/types'
import { mockPlaybackBackend } from '@/mocks/mockPlaybackBackend'

// Real trigon-api calls. TODO(api): the history endpoint is not defined yet. It should return the
// raw reports for [from, to] (time, lat, lng, speed, odometer) so the trip settings (over-speed
// limit, hold time) can be applied on the client. `place` is a reverse-geocode of a stop. Implement
// with `http` from '@/services/api/http' and keep these signatures.
const notReady = (name: string) => () => Promise.reject(new Error(`playbackService.${name}: API not integrated yet`))

const apiBackend: typeof mockPlaybackBackend = {
  get: notReady('get') as (id: string, from: number, to: number) => Promise<PlaybackRoute>,
  place: notReady('place') as (lat: number, lng: number) => Promise<string>,
}

const backend = env.useMock ? mockPlaybackBackend : apiBackend

export const getPlayback = (vehicleId: string, from: number, to: number) => backend.get(vehicleId, from, to)
export const getPlaceName = (lat: number, lng: number) => backend.place(lat, lng)
