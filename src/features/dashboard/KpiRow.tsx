import { faCalendarXmark, faCircleCheck, faHourglassHalf, faTruck } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { formatPercent } from './format'
import type { PlanFilter, VehicleKpis } from './types'

const TILES: { plan: PlanFilter; label: string; icon: IconDefinition; tile: string; bar: string }[] = [
  { plan: 'total', label: 'Total Vehicles', icon: faTruck, tile: 'bg-icon-tile text-primary', bar: 'bg-primary' },
  { plan: 'active', label: 'Active Plans', icon: faCircleCheck, tile: 'bg-moving-bg text-moving-fg', bar: 'bg-moving' },
  { plan: 'expiring', label: 'Expiring in 30 days', icon: faHourglassHalf, tile: 'bg-idle-bg text-idle-fg', bar: 'bg-idle' },
  { plan: 'expired', label: 'Expired · Recharge due', icon: faCalendarXmark, tile: 'bg-stopped-bg text-stopped-fg', bar: 'bg-stopped' },
]

type Props = {
  kpis: VehicleKpis | undefined
  selected: PlanFilter
  onSelect: (plan: PlanFilter) => void
}

/** Four plan-state tiles; picking one filters the vehicle list. */
export function KpiRow({ kpis, selected, onSelect }: Props) {
  // Phones: one swipeable row. md: 2 columns. xl: 4 columns.
  return (
    <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 [scrollbar-width:none] md:mx-0 md:grid md:snap-none md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-4 [&::-webkit-scrollbar]:hidden">
      {TILES.map((t) => {
        const active = selected === t.plan
        const value = kpis?.[t.plan]
        const share = kpis && kpis.total > 0 ? ((value ?? 0) / kpis.total) * 100 : 0
        return (
          <button
            key={t.plan}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(t.plan)}
            className={`flex w-[260px] shrink-0 snap-start flex-col gap-3 rounded-2xl border bg-surface p-4 text-left md:w-auto md:shrink transition-colors hover:border-primary/60 ${
              active ? 'border-primary bg-selected ring-1 ring-primary' : 'border-line'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${t.tile}`}>
                <FontAwesomeIcon icon={t.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] text-ink-2">{t.label}</div>
                {value === undefined ? (
                  <div className="mt-1 h-7 w-[72px] rounded-lg bg-skeleton motion-safe:animate-pulse" />
                ) : (
                  <div className="text-[28px] font-semibold leading-9 text-ink">{value}</div>
                )}
              </div>
              {kpis && <span className="text-xs text-ink-3">{formatPercent(value ?? 0, kpis.total)}</span>}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-skeleton-soft">
              <div className={`h-full rounded-full ${t.bar}`} style={{ width: `${share}%` }} />
            </div>
          </button>
        )
      })}
    </div>
  )
}
