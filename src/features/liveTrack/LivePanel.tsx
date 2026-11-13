import {
  faAnglesLeft,
  faAnglesRight,
  faBolt,
  faCircleInfo,
  faClock,
  faClockRotateLeft,
  faGasPump,
  faLocationDot,
  faShareNodes,
  faSnowflake,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Vehicle, VehicleStatus } from '@/features/dashboard/types'
import { formatFullDateTimeSeconds } from '@/features/dashboard/format'
import { Alerts, NoAlerts, ValuePill } from '@/components/vehicle/VehicleParts'
import { formatAgoSeconds } from './geo'
import type { LiveTrack } from './types'

const TICKS = 31
const SWEEP = 270
const MAX_SPEED = 120
const LIT: Record<VehicleStatus, string> = {
  moving: 'var(--moving)',
  idle: 'var(--idle)',
  stopped: 'var(--stopped)',
  offline: 'var(--offline)',
}

/** Figma "Speed Gauge": 31 ticks over 270 degrees, speed in the middle. */
function LiveGauge({ speed, status }: { speed: number | null; status: VehicleStatus }) {
  const lit = speed === null ? 0 : Math.min(TICKS, Math.round((speed / MAX_SPEED) * TICKS))
  const step = SWEEP / (TICKS - 1)
  return (
    <div
      className="relative h-[112px] w-[158px] shrink-0"
      role="img"
      aria-label={speed === null ? 'No speed reading' : `${Math.round(speed)} kilometres per hour`}
    >
      <svg viewBox="0 0 176 124" className="absolute inset-0 h-full w-full">
        {Array.from({ length: TICKS }, (_, i) => {
          const a = ((-SWEEP / 2 + i * step) * Math.PI) / 180
          const sin = Math.sin(a)
          const cos = Math.cos(a)
          return (
            <line
              key={i}
              x1={88 + 51 * sin}
              y1={67 - 51 * cos}
              x2={88 + 65 * sin}
              y2={67 - 65 * cos}
              stroke={i < lit ? LIT[status] : 'var(--gauge-track)'}
              strokeWidth={4}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="absolute inset-x-0 top-[40px] flex flex-col items-center">
        <span className="text-[36px] font-semibold leading-[54px] text-ink">{speed === null ? '—' : Math.round(speed)}</span>
        <span className="-mt-0.5 text-sm leading-5 text-ink-3">km/h</span>
      </div>
    </div>
  )
}

const onOff = (v: boolean | null) => (v === null ? '—' : v ? 'On' : 'Off')
const fuel = (v: number | null) => (v === null ? '—' : `~${v}%`)

function Metric({ icon, label, children }: { icon: IconDefinition; label: string; children: React.ReactNode }) {
  return (
    <div className="flex h-7 items-center justify-between">
      <span className="flex items-center gap-2 text-[12px] text-ink-2">
        <FontAwesomeIcon icon={icon} className="w-4 text-ink-3" />
        {label}
      </span>
      {children}
    </div>
  )
}

type Tone = 'good' | 'bad' | 'plain'
const HEALTH_TONE: Record<Tone, string> = {
  good: 'bg-moving-bg text-moving-fg',
  bad: 'bg-stopped-bg text-stopped-fg',
  plain: 'bg-offline-bg text-ink-2',
}

function HealthRow({ label, value, tone }: { label: string; value: string; tone: Tone }) {
  return (
    <div className="flex h-8 items-center justify-between">
      <span className="text-[12px] text-ink-2">{label}</span>
      <span className={`inline-flex h-6 items-center rounded-full px-3 text-xs font-medium ${HEALTH_TONE[tone]}`}>{value}</span>
    </div>
  )
}

/** Reads the health rows from the alerts the vehicle already carries. */
function health(vehicle: Vehicle): { label: string; value: string; tone: Tone }[] {
  const has = (a: Vehicle['alerts'][number]) => vehicle.alerts.includes(a)
  return [
    { label: 'Battery', value: has('batteryDisconnected') ? 'Disconnected' : 'Connected', tone: has('batteryDisconnected') ? 'bad' : 'good' },
    { label: 'Network', value: has('networkError') ? 'Poor' : 'Good', tone: has('networkError') ? 'bad' : 'good' },
    { label: 'GPS location', value: has('locationError') ? 'Weak' : 'Accurate', tone: has('locationError') ? 'bad' : 'good' },
    // TODO(api): firmware version is not in the vehicle model yet.
    { label: 'Device software', value: 'v2.4.1', tone: 'plain' },
  ]
}

const CAPTION = 'text-[10px] font-medium uppercase tracking-wide text-ink-3'
const CARD = 'pointer-events-auto rounded-2xl border border-line bg-surface shadow-[0_8px_24px_rgba(15,27,45,0.12)]'
const BTN = 'inline-flex h-10 min-w-[86px] flex-1 basis-[96px] items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-line bg-surface px-2 text-[12px] font-medium text-control hover:bg-surface-muted disabled:opacity-50'

type Props = {
  vehicle: Vehicle
  track: LiveTrack
  now: number
  collapsed: boolean
  onToggle: () => void
  onShare: () => void
  onPlayBack: () => void
  onViewMore: () => void
  onDriveTo: () => void
}

/** Left panel. Figma: Live Track / Desktop / Light (Vehicle Panel) and "· Panel collapsed". */
export function LivePanel({ vehicle, track, now, collapsed, onToggle, onShare, onPlayBack, onViewMore, onDriveTo }: Props) {
  const offline = vehicle.status === 'offline'
  const speed = track.speed
  const ago = formatAgoSeconds(track.updatedAt, now)

  if (collapsed) {
    const alertCount = vehicle.alerts.length
    const chip = 'inline-flex h-[23px] items-center whitespace-nowrap rounded-full px-3 text-xs font-medium'
    return (
      <div className={`${CARD} flex w-fit max-w-full items-center gap-3 px-3.5 py-[12px] lg:w-[313px]`}>
        <div className="flex w-14 shrink-0 flex-col items-center">
          <span className="text-[25px] font-semibold leading-8 text-ink">{speed === null ? '—' : Math.round(speed)}</span>
          <span className="text-xs text-ink-3">km/h</span>
        </div>
        <div className="h-12 w-px shrink-0 bg-line" />
        <div className="flex flex-wrap gap-x-2 gap-y-1.5">
          <span className={`${chip} ${vehicle.ignition ? 'bg-moving-bg text-moving-fg' : 'bg-offline-bg text-ink-2'}`}>Ignition {onOff(vehicle.ignition)}</span>
          <span className={`${chip} bg-offline-bg text-ink-2`}>AC {onOff(vehicle.ac)}</span>
          <span className={`${chip} bg-offline-bg text-ink-2`}>Fuel {fuel(vehicle.fuelPercent)}</span>
          <span className={`${chip} ${alertCount ? 'bg-stopped-bg text-stopped-fg' : 'bg-moving-bg text-moving-fg'}`}>
            {alertCount ? `${alertCount} ${alertCount === 1 ? 'alert' : 'alerts'}` : 'No alerts'}
          </span>
        </div>
        <button
          onClick={onToggle}
          aria-label="Expand live details"
          title="Expand panel"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-control hover:bg-line"
        >
          <FontAwesomeIcon icon={faAnglesRight} className="text-xs" />
        </button>
      </div>
    )
  }

  return (
    <div className={`${CARD} @container flex max-h-full w-full max-w-[356px] flex-col overflow-hidden`}>
      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overflow-x-hidden p-6 pb-5">
      <div className="flex h-8 items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Live details</h2>
        <button
          onClick={onToggle}
          aria-label="Collapse live details"
          title="Collapse panel"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-control hover:bg-line"
        >
          <FontAwesomeIcon icon={faAnglesLeft} className="text-xs" />
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 @[380px]:justify-between">
        <LiveGauge speed={speed} status={vehicle.status} />
        <div className="min-w-[126px] flex-1 basis-[140px]">
          <Metric icon={faBolt} label="Ignition">
            <ValuePill text={onOff(vehicle.ignition)} tone={vehicle.ignition ? 'on' : 'off'} />
          </Metric>
          <div className="h-3.5" />
          <Metric icon={faSnowflake} label="AC">
            <ValuePill text={onOff(vehicle.ac)} tone={vehicle.ac ? 'onBlue' : 'off'} />
          </Metric>
          <div className="h-3.5" />
          <Metric icon={faGasPump} label="Fuel">
            <ValuePill text={fuel(vehicle.fuelPercent)} tone="plain" />
          </Metric>
        </div>
      </div>

      <div className="min-h-8 flex items-center">{vehicle.alerts.length ? <Alerts alerts={vehicle.alerts} /> : <NoAlerts />}</div>

      <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-3 gap-y-0.5 rounded-xl bg-surface-muted px-4 py-2">
        <span className={`flex items-center gap-2 text-[12px] font-medium ${offline ? 'text-stopped-fg' : 'text-ink'}`}>
          <FontAwesomeIcon icon={faClock} className={offline ? 'text-stopped' : 'text-primary'} />
          {offline ? 'Last seen' : 'Updated'} {ago}
        </span>
        <span className="text-xs text-ink-2">{formatFullDateTimeSeconds(track.updatedAt)}</span>
      </div>

      <div className="min-h-40">
        <h3 className={CAPTION}>Device health</h3>
        <div className="mt-2.5">
          {health(vehicle).map((r) => (
            <HealthRow key={r.label} {...r} />
          ))}
        </div>
      </div>

      </div>

      <div className="flex shrink-0 flex-col gap-5 px-6 pb-[28px] pt-1">
      <button
        onClick={onDriveTo}
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-on-primary hover:bg-primary-hover"
      >
        <FontAwesomeIcon icon={faLocationDot} />
        Drive To
      </button>

      <div className="flex flex-wrap gap-2">
        <button className={BTN} onClick={onPlayBack}>
          <FontAwesomeIcon icon={faClockRotateLeft} />
          Play Back
        </button>
        <button className={BTN} onClick={onShare}>
          <FontAwesomeIcon icon={faShareNodes} />
          Share
        </button>
        <button className={BTN} onClick={onViewMore}>
          <FontAwesomeIcon icon={faCircleInfo} />
          View More
        </button>
      </div>
      </div>
    </div>
  )
}
