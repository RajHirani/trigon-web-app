import { env } from '@/config/env'
import type { LiveTrack, ShareDuration, ShareLink } from '@/features/liveTrack/types'
import { mockLiveTrackBackend } from '@/mocks/mockLiveTrackBackend'

// Real trigon-api calls. TODO(api): the live endpoints are not defined yet (position feed is
// likely MQTT, the `mqtt` package is already installed); implement with `http` from
// '@/services/api/http' and keep these signatures.
const notReady = (name: string) => () => Promise.reject(new Error(`liveTrackService.${name}: API not integrated yet`))

const apiBackend: typeof mockLiveTrackBackend = {
  get: notReady('get') as (id: string) => Promise<LiveTrack>,
  createShare: notReady('createShare') as (id: string, d: ShareDuration, hours?: number) => Promise<ShareLink>,
  stopShare: notReady('stopShare') as (id: string) => Promise<void>,
}

const backend = env.useMock ? mockLiveTrackBackend : apiBackend

export const getLiveTrack = (vehicleId: string) => backend.get(vehicleId)
export const createShareLink = (vehicleId: string, duration: ShareDuration, customHours?: number) =>
  backend.createShare(vehicleId, duration, customHours)
export const stopSharing = (vehicleId: string) => backend.stopShare(vehicleId)
