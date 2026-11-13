import { faTriangleExclamation, faTruck } from '@fortawesome/free-solid-svg-icons'
import type L from 'leaflet'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { TrigonLoader } from '@/components/TrigonLoader'
import { EmptyState } from '@/components/EmptyState'
import { MapControls } from '@/features/liveTrack/LiveOverlays'
import { vehicleKindOf } from '@/features/liveTrack/vehicleIcons'
import type { MapLayer } from '@/features/liveTrack/types'
import { useVehicle } from '@/features/vehicleDetails/useVehicleDetails'
import { analyzeTrip, EMPTY_ANALYSIS } from './analyze'
import { PlaybackControls } from './PlaybackControls'
import { PlaybackMap } from './PlaybackMap'
import { PlaybackHeader, PlaybackNotice } from './PlaybackOverlays'
import { PlaybackPanel } from './PlaybackPanel'
import { describeRange, formatRangeChip, presetRange } from './range'
import { RangePicker } from './RangePicker'
import {
  DEFAULT_SETTINGS,
  type MarkerSelection,
  type PlaybackPoint,
  type PlaybackRange,
  type RangeDraft,
  type RangePreset,
  type TripSettings,
} from './types'
import { usePlayback, usePlayer } from './usePlayback'

const narrow = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
const NO_POINTS: PlaybackPoint[] = []
/** Shorter than this and the vehicle is treated as not having moved. */
const MIN_KM = 0.05

// Full-screen route playback. Figma section "Playback / Desktop / Light" (Playing, Stop selected, Custom range picker,
// Range over 7 days, Loading, Empty, Error, Panel collapsed). Like Live Track, the shell hides its header here.
export default function PlaybackPage() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const vehicle = useVehicle(vehicleId)

  const [range, setRange] = useState<PlaybackRange>(() => presetRange('today'))
  const [settings, setSettings] = useState<TripSettings>(DEFAULT_SETTINGS)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerNow, setPickerNow] = useState(0)
  const [draft, setDraft] = useState<RangeDraft | null>(null)
  const [collapsed, setCollapsed] = useState(narrow)
  const [follow, setFollow] = useState(true)
  const [layer, setLayer] = useState<MapLayer>('street')
  const [selection, setSelection] = useState<MarkerSelection | null>(null)
  const [map, setMap] = useState<L.Map | null>(null)

  const playback = usePlayback(vehicleId, range)
  const points = playback.data?.points ?? NO_POINTS
  const analysis = useMemo(() => analyzeTrip(points, settings), [points, settings])
  const hasRoute = points.length > 1 && analysis.distanceKm >= MIN_KM
  const player = usePlayer(hasRoute ? points.length : 0, playback.data)

  // A new route starts with nothing selected and the map following the vehicle.
  useEffect(() => {
    setSelection(null)
    setFollow(true)
  }, [playback.data])

  const goBack = useCallback(() => {
    // Back to where the user came from (dashboard, View More or Live Track); a direct visit goes to the dashboard.
    if ((window.history.state as { idx?: number } | null)?.idx) navigate(-1)
    else navigate('/dashboard')
  }, [navigate])
  const stopFollowing = useCallback(() => setFollow(false), [])
  const closePicker = useCallback(() => setPickerOpen(false), [])
  const openPicker = useCallback(() => {
    setPickerNow(Date.now())
    setPickerOpen(true)
  }, [])
  const choosePreset = useCallback((p: Exclude<RangePreset, 'custom'>) => {
    setPickerOpen(false)
    setRange(presetRange(p))
  }, [])
  const applyRange = useCallback((r: PlaybackRange) => {
    setPickerOpen(false)
    setRange(r)
  }, [])
  const changeSettings = useCallback((s: TripSettings) => {
    setSelection(null)
    setSettings(s)
  }, [])
  const select = useCallback(
    (s: MarkerSelection | null) => {
      // The vehicle card describes one moment, so the playback stops there.
      if (s?.kind === 'vehicle') player.pause()
      setSelection(s)
    },
    [player],
  )
  const playFrom = useCallback(
    (idx: number) => {
      setSelection(null)
      player.playFrom(idx)
    },
    [player],
  )

  const v = vehicle.data
  if (vehicle.isError || (vehicle.isSuccess && v === null)) {
    const failed = vehicle.isError
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={failed ? faTriangleExclamation : faTruck}
          title={failed ? 'Couldn’t load playback' : 'Vehicle not found'}
          description={
            failed
              ? 'Something went wrong while loading this vehicle. Please try again.'
              : 'This vehicle doesn’t exist or isn’t on your account any more.'
          }
          actionLabel={failed ? 'Try again' : 'Back to dashboard'}
          onAction={failed ? () => void vehicle.refetch() : () => navigate('/dashboard')}
        />
      </div>
    )
  }
  // TODO: not designed - while only the vehicle is loading the screen just pulses (the route loader needs the plate).
  if (!v) {
    return <div className="h-full w-full bg-skeleton-soft motion-safe:animate-pulse" role="status" aria-label="Loading playback" />
  }

  const loading = playback.isPending
  const failed = playback.isError
  const empty = playback.isSuccess && !hasRoute
  const showRoute = playback.isSuccess && hasRoute

  const nextTry: { label: string; to: Exclude<RangePreset, 'custom'> } =
    range.preset === 'today'
      ? { label: 'Try Yesterday', to: 'yesterday' }
      : range.preset === 'yesterday'
        ? { label: 'Try Last 7 days', to: 'week' }
        : { label: 'Try Today', to: 'today' }
  const when =
    range.preset === 'today'
      ? `between 12:00 AM and ${new Date(range.to).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} today`
      : `during ${formatRangeChip(range)}`

  return (
    <div className="relative h-full w-full overflow-hidden bg-app">
      <div className="absolute inset-0 z-0">
        <PlaybackMap
          points={showRoute ? points : NO_POINTS}
          analysis={showRoute ? analysis : EMPTY_ANALYSIS}
          vehicleType={v.vehicleType}
          pos={player.pos}
          layer={layer}
          follow={follow}
          selection={showRoute ? selection : null}
          onUserMove={stopFollowing}
          onReady={setMap}
          onSelect={select}
          onPlayFrom={playFrom}
        />
      </div>

      <div
        className={`pointer-events-none absolute inset-0 z-20 flex flex-col gap-4 p-4 pr-[68px] lg:p-6 lg:pr-[68px] ${
          showRoute ? 'pb-[160px] lg:pb-[160px]' : ''
        }`}
      >
        <div className="pointer-events-none flex flex-wrap items-start gap-4 lg:items-center lg:gap-6">
          <div className="pointer-events-auto w-full lg:w-[640px] lg:max-w-[calc(100%-120px)]">
            <PlaybackHeader vehicle={v} range={range} onBack={goBack} />
          </div>
        </div>
        <div className="pointer-events-none relative flex min-h-0 w-full flex-col lg:w-[396px] [&>*]:pointer-events-auto">
          <PlaybackPanel
            range={range}
            draft={pickerOpen ? draft : null}
            pickerOpen={pickerOpen}
            settings={settings}
            analysis={showRoute ? analysis : null}
            collapsed={collapsed}
            onToggle={() => setCollapsed((c) => !c)}
            onPreset={choosePreset}
            onOpenPicker={openPicker}
            onSettings={changeSettings}
          />
          {pickerOpen && <RangePicker initial={range} now={pickerNow} onCancel={closePicker} onApply={applyRange} onDraft={setDraft} />}
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-4 z-10 lg:right-5 lg:top-6">
        <div className="pointer-events-auto">
          <MapControls
            follow={follow}
            layer={layer}
            onZoomIn={() => map?.zoomIn()}
            onZoomOut={() => map?.zoomOut()}
            onToggleFollow={
              showRoute
                ? () => {
                    setFollow((f) => !f)
                  }
                : undefined
            }
            onLayerChange={setLayer}
          />
        </div>
      </div>

      {showRoute && (
        <div className="absolute bottom-4 left-1/2 z-10 w-[min(1000px,calc(100%-32px))] -translate-x-1/2">
          <PlaybackControls
            points={points}
            analysis={analysis}
            pos={player.pos}
            playing={player.playing}
            speed={player.speed}
            onToggle={player.toggle}
            onSpeed={player.setSpeed}
            onSeek={player.seek}
          />
        </div>
      )}

      {empty && (
        <PlaybackNotice
          tone="empty"
          title="No movement found"
          description={`${v.plate} did not move ${when}. Pick another period to try again.`}
          primary={{ label: nextTry.label, onClick: () => choosePreset(nextTry.to) }}
          secondary={{ label: 'Pick a range', onClick: openPicker }}
        />
      )}
      {failed && (
        <PlaybackNotice
          tone="error"
          title="Couldn’t load playback"
          description={`Something went wrong while fetching the route for ${v.plate}. Check your connection and try again.`}
          primary={{ label: 'Try again', onClick: () => void playback.refetch() }}
          secondary={{ label: 'Go back', onClick: goBack }}
        />
      )}
      {loading && (
        <TrigonLoader
          vehicleKind={vehicleKindOf(v.vehicleType)}
          title="Loading your route"
          subtitle={`${v.plate} · ${describeRange(range)}`}
          onCancel={goBack}
        />
      )}
    </div>
  )
}
