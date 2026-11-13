import {
  faBatteryEmpty,
  faCircleCheck,
  faCircleInfo,
  faClock,
  faClockRotateLeft,
  faLocationCrosshairs,
  faSignal,
  faTriangleExclamation,
  faTruck,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatAgo, formatFullDateTime, formatFullDateTimeSeconds } from './format'
import type { Vehicle, VehicleAlert, VehicleStatus } from './types'

export type VehicleActions = {
  onLiveTrack?: (v: Vehicle) => void
  onPlayBack?: (v: Vehicle) => void
  onViewMore?: (v: Vehicle) => void
}

const STATUS_LABEL: Record<VehicleStatus, string> = {
  moving: 'Moving',
  idle: 'Idle',
  stopped: 'Stopped',
  offline: 'Offline',
}

// Full class names so Tailwind can see them.
const STATUS_PILL: Record<VehicleStatus, string> = {
  moving: 'bg-moving-bg text-moving-fg',
  idle: 'bg-idle-bg text-idle-fg',
  stopped: 'bg-stopped-bg text-stopped-fg',
  offline: 'bg-offline-bg text-offline-fg',
}
const STATUS_DOT: Record<VehicleStatus, string> = {
  moving: 'bg-moving',
  idle: 'bg-idle',
  stopped: 'bg-stopped',
  offline: 'bg-offline',
}

export function StatusPill({ status }: { status: VehicleStatus }) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium ${STATUS_PILL[status]}`}
    >
      <span className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
      {STATUS_LABEL[status]}
    </span>
  )
}

export function VehicleIcon() {
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-icon-tile text-primary">
      {/* TODO(design): only a truck glyph exists; all vehicle types share it. */}
      <FontAwesomeIcon icon={faTruck} />
    </span>
  )
}

const ALERT: Record<VehicleAlert, { label: string; icon: IconDefinition }> = {
  locationError: { label: 'Location error', icon: faTriangleExclamation },
  networkError: { label: 'Network error', icon: faSignal },
  batteryDisconnected: { label: 'Battery disconnected', icon: faBatteryEmpty },
}

function AlertChip({ alert }: { alert: VehicleAlert }) {
  const { label, icon } = ALERT[alert]
  return (
    <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full bg-stopped-bg px-3 text-xs font-medium text-stopped-fg">
      <FontAwesomeIcon icon={icon} className="text-[11px]" />
      {label}
    </span>
  )
}

export function NoAlerts() {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap text-xs text-ink-3">
      <FontAwesomeIcon icon={faCircleCheck} className="text-moving" />
      No active alerts
    </span>
  )
}

export function Alerts({ alerts }: { alerts: VehicleAlert[] }) {
  if (alerts.length === 0) return <NoAlerts />
  return (
    <div className="flex flex-wrap items-center gap-2">
      {alerts.map((a) => (
        <AlertChip key={a} alert={a} />
      ))}
    </div>
  )
}

const TOGGLE_TONE = {
  on: 'bg-moving-bg text-moving-fg',
  onBlue: 'bg-ac-bg text-ac',
  off: 'bg-offline-bg text-ink-3',
}

/** Card row value: "On" / "Off" / "~62%" pill. */
export function ValuePill({ text, tone }: { text: string; tone: 'on' | 'onBlue' | 'off' | 'plain' }) {
  const cls = tone === 'plain' ? 'bg-offline-bg text-ink-2' : TOGGLE_TONE[tone]
  return (
    <span className={`inline-flex h-6 min-w-10 items-center justify-center rounded-full px-2.5 text-xs font-medium ${cls}`}>
      {text}
    </span>
  )
}

/** Offline vehicles read "Last seen 3 days ago" in red; the timestamp wraps under it on narrow cards. */
function UpdatedText({ vehicle }: { vehicle: Vehicle }) {
  const offline = vehicle.status === 'offline'
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
      <div className={`whitespace-nowrap text-[13px] font-medium ${offline ? 'text-stopped-fg' : 'text-ink'}`}>
        {offline ? 'Last seen' : 'Updated'} {formatAgo(vehicle.lastUpdate)}
      </div>
      <div className="whitespace-nowrap text-xs text-ink-2">
        {offline ? formatFullDateTime(vehicle.lastUpdate) : formatFullDateTimeSeconds(vehicle.lastUpdate)}
      </div>
    </div>
  )
}

export function UpdatedPanel({ vehicle }: { vehicle: Vehicle }) {
  const offline = vehicle.status === 'offline'
  return (
    <div className="flex min-h-12 items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 @[380px]:px-4">
      <FontAwesomeIcon icon={faClock} className={`shrink-0 ${offline ? 'text-stopped' : 'text-primary'}`} />
      <div className="min-w-0 flex-1">
        <UpdatedText vehicle={vehicle} />
      </div>
    </div>
  )
}

// Three equal buttons that never leave the card: compact (no icons) on narrow cards.
const BTN =
  'inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-1 text-xs font-medium @[380px]:px-3 @[380px]:text-[13px]'
const ICON = 'hidden @[380px]:inline'

export function ActionButtons({ vehicle, onLiveTrack, onPlayBack, onViewMore }: VehicleActions & { vehicle: Vehicle }) {
  const outline = `${BTN} border border-line bg-surface text-control hover:bg-surface-muted`
  return (
    <div className="flex items-center gap-2">
      <button className={`${BTN} bg-primary text-on-primary hover:bg-primary-hover`} onClick={() => onLiveTrack?.(vehicle)}>
        <FontAwesomeIcon icon={faLocationCrosshairs} className={ICON} />
        Live Track
      </button>
      <button className={outline} onClick={() => onPlayBack?.(vehicle)}>
        <FontAwesomeIcon icon={faClockRotateLeft} className={ICON} />
        Play Back
      </button>
      <button className={outline} onClick={() => onViewMore?.(vehicle)}>
        <FontAwesomeIcon icon={faCircleInfo} className={ICON} />
        View More
      </button>
    </div>
  )
}
