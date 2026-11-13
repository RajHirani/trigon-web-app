import {
  faBolt,
  faClock,
  faGasPump,
  faGaugeHigh,
  faHourglassHalf,
  faLocationDot,
  faLock,
  faRoute,
} from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatKm, splitMinutes } from '@/features/dashboard/format'
import type { VehicleSummary } from '@/features/dashboard/types'

const CARD = 'rounded-2xl border border-line bg-surface'
const TILE_GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'

function IconTile({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base ${tone}`}>{children}</span>
  )
}

function Tile({
  icon,
  tone,
  label,
  aside,
  children,
}: {
  icon: React.ReactNode
  tone: string
  label: string
  aside?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className={`${CARD} flex min-h-[112px] flex-col justify-between gap-3 p-5`}>
      <div className="flex items-center gap-3">
        <IconTile tone={tone}>{icon}</IconTile>
        <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-ink-2">{label}</span>
        {aside}
      </div>
      <div className="flex items-baseline gap-1.5 text-[25px] font-semibold leading-[38px] text-ink">{children}</div>
    </div>
  )
}

const Unit = ({ children }: { children: React.ReactNode }) => (
  <span className="mr-1.5 text-sm font-medium leading-[19px] text-ink-3 last:mr-0">{children}</span>
)

function Duration({ minutes }: { minutes: number }) {
  const { h, min } = splitMinutes(minutes)
  return (
    <>
      <span>{h}</span>
      <Unit>h</Unit>
      <span>{min}</span>
      <Unit>min</Unit>
    </>
  )
}

const fa = (icon: IconDefinition) => <FontAwesomeIcon icon={icon} />

function LockSwitch({ locked, disabled, onToggle }: { locked: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={locked}
      aria-label="Device lock"
      disabled={disabled}
      onClick={onToggle}
      className={`relative h-[27px] w-[47px] shrink-0 rounded-full transition-colors disabled:opacity-60 ${locked ? 'bg-primary' : 'bg-switch-off'}`}
    >
      <span
        className={`absolute top-[2.5px] h-6 w-6 rounded-full bg-white shadow transition-[left] ${locked ? 'left-[22px]' : 'left-[2.5px]'}`}
      />
    </button>
  )
}

type Props = { summary: VehicleSummary; fuelPercent: number | null; lockBusy: boolean; onToggleLock: () => void }

export function SummaryTiles({ summary: s, fuelPercent, lockBusy, onToggleLock }: Props) {
  return (
    <div className={TILE_GRID}>
      <Tile icon={fa(faRoute)} tone="bg-icon-tile text-primary" label="Odometer">
        <span>{formatKm(s.odometerKm)}</span>
        <Unit>km</Unit>
      </Tile>
      <Tile icon={fa(faGaugeHigh)} tone="bg-violet-bg text-violet" label="Running distance">
        <span>{formatKm(s.runningDistanceKm)}</span>
        <Unit>km</Unit>
      </Tile>
      <Tile icon={fa(faBolt)} tone="bg-moving-bg text-moving-fg" label="Running duration">
        <Duration minutes={s.runningMinutes} />
      </Tile>
      <Tile icon={fa(faHourglassHalf)} tone="bg-idle-bg text-idle-fg" label="Idle duration">
        <Duration minutes={s.idleMinutes} />
      </Tile>
      <Tile icon={<span className="h-3.5 w-3.5 rounded-[2.5px] bg-stopped" />} tone="bg-stopped-bg" label="Stop duration">
        <Duration minutes={s.stopMinutes} />
      </Tile>
      <Tile icon={fa(faClock)} tone="bg-offline-bg text-ink-2" label="Total working duration">
        <Duration minutes={s.totalWorkingMinutes} />
      </Tile>
      <Tile
        icon={fa(faGasPump)}
        tone="bg-teal-bg text-teal"
        label="Fuel"
        aside={
          fuelPercent === null ? undefined : (
            <span className="inline-flex h-6 items-center rounded-full bg-offline-bg px-2.5 text-xs font-medium text-ink-2">
              ~{fuelPercent}%
            </span>
          )
        }
      >
        {s.fuelLitres === null ? (
          <span className="text-ink-3">—</span>
        ) : (
          <>
            <span>{s.fuelLitres}</span>
            <Unit>L</Unit>
          </>
        )}
      </Tile>
      <Tile
        icon={fa(faLock)}
        tone="bg-offline-bg text-ink-2"
        label="Device lock"
        aside={<LockSwitch locked={s.locked} disabled={lockBusy} onToggle={onToggleLock} />}
      >
        <span>{s.locked ? 'Locked' : 'Unlocked'}</span>
      </Tile>
    </div>
  )
}

export function AddressCard({ address, lat, lng }: { address: string; lat: number; lng: number }) {
  return (
    <div className={`${CARD} flex flex-wrap items-center gap-4 p-5`}>
      <IconTile tone="bg-icon-tile text-primary">{fa(faLocationDot)}</IconTile>
      <div className="min-w-0 flex-1 basis-60">
        <div className="text-[12px] font-medium text-ink-2">Address</div>
        <div className="text-base font-medium text-ink">{address}</div>
      </div>
      <a
        href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-primary hover:underline"
      >
        View on map
      </a>
    </div>
  )
}

// Loading state: Figma "Dashboard / Desktop / Light · View More · Loading".
const PULSE = 'motion-safe:animate-pulse'

export function SummarySkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-4">
      <div className={TILE_GRID}>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className={`${CARD} flex min-h-[112px] flex-col justify-between gap-3 p-5`}>
            <div className="flex items-center gap-3">
              <div className={`${PULSE} h-11 w-11 shrink-0 rounded-xl bg-skeleton-soft`} />
              <div className={`${PULSE} h-3 w-[108px] rounded-md bg-skeleton-soft`} />
            </div>
            <div className={`${PULSE} h-[20px] w-[135px] rounded-md bg-skeleton`} />
          </div>
        ))}
      </div>
      <div className={`${CARD} flex items-center gap-4 p-5`}>
        <div className={`${PULSE} h-11 w-11 shrink-0 rounded-xl bg-skeleton-soft`} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className={`${PULSE} h-3 w-[81px] rounded-md bg-skeleton-soft`} />
          <div className={`${PULSE} h-4 w-full max-w-[558px] rounded-md bg-skeleton`} />
        </div>
      </div>
    </div>
  )
}
