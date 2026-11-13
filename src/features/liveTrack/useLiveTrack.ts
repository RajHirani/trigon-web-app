import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createShareLink, getLiveTrack, stopSharing } from '@/services/liveTrack/liveTrackService'
import type { ShareDuration } from './types'

export const LIVE_REFRESH_MS = 5000

/** Position + path, refreshed every 5 s. Keeps the last good data while a refresh is running or failing. */
export function useLiveTrack(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['live-track', vehicleId],
    queryFn: () => getLiveTrack(vehicleId!),
    enabled: !!vehicleId,
    refetchInterval: LIVE_REFRESH_MS,
    placeholderData: keepPreviousData,
  })
}

/** Re-renders every second so "updated N sec ago" counts up between refreshes. */
export function useNowEverySecond() {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function useCreateShare(vehicleId: string) {
  return useMutation({
    mutationFn: (v: { duration: ShareDuration; customHours?: number }) =>
      createShareLink(vehicleId, v.duration, v.customHours),
  })
}

export function useStopSharing(vehicleId: string) {
  return useMutation({ mutationFn: () => stopSharing(vehicleId) })
}
