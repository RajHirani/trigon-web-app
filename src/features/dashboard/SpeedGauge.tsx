import type { VehicleStatus } from './types'

const W = 150
const H = 124
const CX = 75
const CY = 66
const RADIUS = 56
const TICKS = 36
const SWEEP = 270 // degrees; the opening faces down
const TICK_LEN = 14
const TICK_W = 4
const MAX_SPEED = 120

const LIT: Record<VehicleStatus, string> = {
  moving: 'var(--moving)',
  idle: 'var(--idle)',
  stopped: 'var(--stopped)',
  offline: 'var(--offline)',
}

type Props = {
  /** km/h; null when there is no reading (offline). */
  speed: number | null
  status: VehicleStatus
}

/** Arc of ticks with the speed in the middle; ticks light up in proportion to speed. */
export function SpeedGauge({ speed, status }: Props) {
  const lit = speed === null ? 0 : Math.min(TICKS, Math.round((speed / MAX_SPEED) * TICKS))
  const step = SWEEP / (TICKS - 1)
  const half = (TICK_LEN - TICK_W) / 2
  return (
    <div className="relative aspect-[150/124] w-[120px] shrink-0 @[380px]:w-[150px]" role="img" aria-label={speed === null ? 'No speed reading' : `${Math.round(speed)} kilometres per hour`}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full">
        {Array.from({ length: TICKS }, (_, i) => {
          const a = ((-SWEEP / 2 + i * step) * Math.PI) / 180
          const sin = Math.sin(a)
          const cos = Math.cos(a)
          return (
            <line
              key={i}
              x1={CX + (RADIUS - half) * sin}
              y1={CY - (RADIUS - half) * cos}
              x2={CX + (RADIUS + half) * sin}
              y2={CY - (RADIUS + half) * cos}
              stroke={i < lit ? LIT[status] : 'var(--gauge-track)'}
              strokeWidth={TICK_W}
              strokeLinecap="round"
            />
          )
        })}
      </svg>
      <div className="absolute inset-x-0 top-[31%] flex flex-col items-center">
        <span className="text-[26px] font-semibold leading-8 @[380px]:text-[32px] @[380px]:leading-10 text-ink">{speed === null ? '—' : Math.round(speed)}</span>
        <span className="text-[13px] leading-5 text-ink-3">km/h</span>
      </div>
    </div>
  )
}
