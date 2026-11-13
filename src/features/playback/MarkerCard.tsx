import { faArrowUpRightFromSquare, faLocationDot, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatCoords } from '@/features/liveTrack/geo'
import type { Sample } from './analyze'
import { formatClockMs, formatDuration, formatDistance } from './range'
import type { MarkerSelection, OverSpeedEvent, Stop } from './types'
import { usePlaceName } from './usePlayback'

const CAPTION = 'text-[10px] font-medium uppercase tracking-wide text-ink-3'

function Column({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0">
      <div className={CAPTION}>{label}</div>
      <div className={`mt-1 whitespace-nowrap text-[13px] font-medium ${tone}`}>{value}</div>
    </div>
  )
}

type Props = {
  selection: MarkerSelection
  stop?: Stop
  event?: OverSpeedEvent
  /** The vehicle as it was when tapped. */
  vehicle?: Sample
  /** Point index the vehicle should jump to for "Play from here". */
  playIdx: number
  onClose: () => void
  onPlayFrom: (idx: number) => void
}

/** Details card of a stop, an over-speed point or the vehicle: place, coordinates, Google Maps link. Figma: "Stop selected" popover. */
export function MarkerCard({ selection, stop, event, vehicle, playIdx, onClose, onPlayFrom }: Props) {
  const point = stop ?? event ?? vehicle
  const place = usePlaceName(point?.lat, point?.lng)
  if (!point) return null
  const kind = selection.kind

  return (
    <div className="w-[296px] rounded-2xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgba(15,27,45,0.18)]">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold ${
            kind === 'stop' ? 'bg-ink text-surface' : kind === 'overSpeed' ? 'bg-stopped text-white' : 'bg-primary text-on-primary'
          }`}
        >
          {kind === 'stop' ? selection.n : kind === 'overSpeed' ? '!' : <FontAwesomeIcon icon={faLocationDot} className="text-xs" />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-semibold leading-5 text-ink">
            {kind === 'stop' ? `Stop ${selection.n}` : kind === 'overSpeed' ? `Over-speed ${selection.n}` : 'Vehicle position'}
          </div>
          <div className="truncate text-xs text-ink-3">{place.isPending ? 'Finding location…' : (place.data ?? 'Location unavailable')}</div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close details"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-2 hover:bg-line"
        >
          <FontAwesomeIcon icon={faXmark} className="text-xs" />
        </button>
      </div>

      <div className="my-3 h-px bg-line" />

      {stop && (
        <div className="grid grid-cols-3 gap-2">
          <Column label="Arrived" value={formatClockMs(stop.arrivedAt)} />
          <Column label="Departed" value={formatClockMs(stop.departedAt)} />
          <Column label="Duration" value={formatDuration(stop.durationMs)} tone="text-idle-fg" />
        </div>
      )}
      {event && (
        <div className="grid grid-cols-3 gap-2">
          <Column label="Started" value={formatClockMs(event.startAt)} />
          <Column label="Peak" value={`${Math.round(event.maxSpeed)} km/h`} tone="text-stopped-fg" />
          <Column label="Duration" value={formatDuration(event.endAt - event.startAt)} />
        </div>
      )}
      {vehicle && (
        <div className="grid grid-cols-3 gap-2">
          <Column label="Time" value={formatClockMs(vehicle.t)} />
          <Column label="Speed" value={`${Math.round(vehicle.speed)} km/h`} tone="text-moving-fg" />
          <Column label="Distance" value={formatDistance(vehicle.km)} />
        </div>
      )}

      <div className="mt-3 rounded-lg bg-surface-muted px-3 py-2">
        <div className={CAPTION}>Location</div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="select-all text-[13px] font-medium text-ink">{formatCoords(point.lat, point.lng)}</span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Open this location in Google Maps"
            title="Open in Google Maps"
            className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            Google Maps
            <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-[10px]" />
          </a>
        </div>
      </div>

      <button
        onClick={() => onPlayFrom(playIdx)}
        className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary text-[13px] font-medium text-on-primary hover:bg-primary-hover"
      >
        Play from here
      </button>
    </div>
  )
}
