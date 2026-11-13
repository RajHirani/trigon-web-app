import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { VEHICLE_GRID } from './layout'

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: IconDefinition
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-[72px] text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-icon-tile text-[28px] text-primary">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-[640px] text-sm text-ink-3">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 h-11 rounded-lg bg-primary px-5 text-[13px] font-medium text-on-primary hover:bg-primary-hover"
      >
        {actionLabel}
      </button>
    </div>
  )
}

// Shapes and tones follow Figma "Dashboard / Desktop / Light · Loading" (Skeleton Card, 396 x 420).
// Strong = skeleton, soft = skeleton-soft, panel = skeleton-panel. Pulse only when motion is allowed.
const PULSE = 'motion-safe:animate-pulse'
const strong = (cls: string) => <div className={`${PULSE} bg-skeleton ${cls}`} />
const soft = (cls: string) => <div className={`${PULSE} bg-skeleton-soft ${cls}`} />

function CardSkeleton() {
  return (
    <div className="@container min-w-0" aria-hidden>
      <div className="flex h-full flex-col gap-4 rounded-[20px] border border-line bg-surface p-4 @[380px]:gap-0 @[380px]:px-6 @[380px]:pb-[23px] @[380px]:pt-6 [&>*:nth-child(2)]:@[380px]:mt-[25px] [&>*:nth-child(3)]:@[380px]:mt-8 [&>*:nth-child(4)]:@[380px]:mt-7 [&>*:nth-child(5)]:@[380px]:mt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {strong('h-11 w-11 shrink-0 rounded-xl')}
            <div className="flex flex-col gap-2">
              {strong('h-4 w-[120px] rounded-md')}
              {soft('h-3 w-[92px] rounded-md')}
            </div>
          </div>
          {strong('h-7 w-20 shrink-0 rounded-full')}
        </div>
        <div className="flex items-center gap-4 @[380px]:gap-0">
          <div className="flex flex-1 justify-center">{soft('h-[120px] w-[120px] rounded-full')}</div>
          <div className="flex w-[45%] max-w-[156px] shrink-0 flex-col gap-[22px] @[380px]:w-[156px]">
            {soft('h-5 w-full rounded-[10px]')}
            {soft('h-5 w-full rounded-[10px]')}
            {soft('h-5 w-full rounded-[10px]')}
          </div>
        </div>
        {soft('h-3.5 w-[130px] rounded-[7px]')}
        {/* the panel colour is a lighter tone than the bars, so it is not pulsed separately */}
        <div className={`${PULSE} h-12 rounded-[14px] bg-skeleton-panel`} />
        <div className="flex gap-2">
          {strong('h-10 flex-1 rounded-[10px]')}
          {soft('h-10 flex-1 rounded-[10px]')}
          {soft('h-10 flex-1 rounded-[10px]')}
        </div>
      </div>
    </div>
  )
}

/** Placeholder while the first page loads. */
export function VehiclesSkeleton({ count }: { count: number }) {
  return (
    <div className={VEHICLE_GRID} role="status" aria-label="Loading vehicles">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
}
