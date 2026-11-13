import { faTriangleExclamation, faTruck } from '@fortawesome/free-solid-svg-icons'
import type L from 'leaflet'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGoBack } from '@/hooks/useGoBack'
import { EmptyState } from '@/components/EmptyState'
import { useVehicle } from '@/features/vehicleDetails/useVehicleDetails'
import { LiveHeader, MapControls, PathLegend } from './LiveOverlays'
import { LiveMap } from './LiveMap'
import { LivePanel } from './LivePanel'
import { ShareDialog } from './ShareDialog'
import type { MapLayer } from './types'
import { useLiveTrack, useNowEverySecond } from './useLiveTrack'

const narrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

// Full-screen live map. Figma: Live Track / Desktop / Light (+ Share dialog, Panel collapsed).
// The shell hides its header for this route and shows the sidebar as the collapsed rail.
export default function LiveTrackPage() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const vehicle = useVehicle(vehicleId)
  const live = useLiveTrack(vehicleId)
  const now = useNowEverySecond()

  const [map, setMap] = useState<L.Map | null>(null)
  const [follow, setFollow] = useState(true)
  const [showPath, setShowPath] = useState(true)
  const [layer, setLayer] = useState<MapLayer>('street')
  const [collapsed, setCollapsed] = useState(narrow)
  const [sharing, setSharing] = useState(false)

  const goBack = useGoBack()
  const stopFollowing = useCallback(() => setFollow(false), [])

  const v = vehicle.data
  const track = live.data

  if (vehicle.isError || (vehicle.isSuccess && v === null) || (live.isError && !track)) {
    const failed = vehicle.isError || live.isError
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={failed ? faTriangleExclamation : faTruck}
          title={failed ? 'Couldn’t load live tracking' : 'Vehicle not found'}
          description={
            failed
              ? 'Something went wrong while loading this vehicle. Please try again.'
              : 'This vehicle doesn’t exist or isn’t on your account any more.'
          }
          actionLabel={failed ? 'Try again' : 'Back to dashboard'}
          onAction={failed ? () => void Promise.all([vehicle.refetch(), live.refetch()]) : () => navigate('/dashboard')}
        />
      </div>
    )
  }

  // TODO: not designed - there is no Figma loading frame, so the map area just pulses until the first fix.
  if (!v || !track) {
    return (
      <div className="h-full w-full bg-skeleton-soft motion-safe:animate-pulse" role="status" aria-label="Loading live tracking" />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-app">
      <div className="absolute inset-0 z-0">
        <LiveMap
          track={track}
          status={v.status}
          vehicleType={v.vehicleType}
          layer={layer}
          follow={follow}
          showPath={showPath}
          onUserMove={stopFollowing}
          onReady={setMap}
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-4 p-4 pb-[68px] pr-[61px] lg:p-6">
        <div className="pointer-events-auto w-full lg:w-[576px] lg:max-w-[calc(100%-120px)]">
          <LiveHeader vehicle={v} updatedAt={track.updatedAt} now={now} onBack={goBack} />
        </div>
        <div className="min-h-0 w-full lg:max-w-[356px]">
          <LivePanel
            vehicle={v}
            track={track}
            now={now}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            onShare={() => setSharing(true)}
            onPlayBack={() => navigate(`/playback/${v.id}`)}
            onViewMore={() => navigate(`/dashboard/${v.id}`)}
            onDriveTo={() =>
              window.open(`https://www.google.com/maps/dir/?api=1&destination=${track.lat},${track.lng}`, '_blank', 'noopener,noreferrer')
            }
          />
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-10 lg:right-5 lg:top-6">
        <div className="pointer-events-auto">
          <MapControls
            follow={follow}
            showPath={showPath}
            layer={layer}
            onZoomIn={() => map?.zoomIn()}
            onZoomOut={() => map?.zoomOut()}
            onToggleFollow={() => {
              setFollow((f) => !f)
              map?.panTo([track.lat, track.lng])
            }}
            onTogglePath={() => setShowPath((s) => !s)}
            onLayerChange={setLayer}
          />
        </div>
      </div>

      <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
        <PathLegend since={track.pathSince} on={showPath} onToggle={() => setShowPath((s) => !s)} />
      </div>

      {sharing && <ShareDialog vehicleId={v.id} onClose={() => setSharing(false)} />}
    </div>
  )
}
