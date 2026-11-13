import { faArrowLeft, faRoute } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import type { Vehicle } from '@/features/dashboard/types'
import { formatRangeChip } from './range'
import type { PlaybackRange } from './types'

export const FLOAT = 'rounded-2xl border border-line bg-surface shadow-[0_8px_24px_rgba(15,27,45,0.12)]'

/** Top-left card: back, plate, "Playback" tag, period. Figma "Playback Header". */
export function PlaybackHeader({ vehicle, range, onBack }: { vehicle: Vehicle; range: PlaybackRange; onBack: () => void }) {
  return (
    <div className={`${FLOAT} flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-3.5 lg:h-[61px] lg:flex-nowrap lg:py-0`}>
      <button
        onClick={onBack}
        aria-label="Back"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink hover:bg-line"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <div className="min-w-0 flex-1 basis-40">
        <div className="truncate text-lg font-semibold leading-[24px] text-ink">{vehicle.plate}</div>
        <div className="truncate text-xs text-ink-3">
          {vehicle.vehicleType} · {vehicle.owner}
        </div>
      </div>
      <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary-subtle px-3 text-xs font-medium text-primary">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Playback
      </span>
      <div className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl bg-surface-muted px-3.5 py-1.5 text-[12px] font-medium text-ink">
        <span className="h-2 w-2 shrink-0 rounded-full bg-offline" />
        <span className="min-w-0">{formatRangeChip(range)}</span>
      </div>
    </div>
  )
}

type NoticeProps = {
  tone: 'empty' | 'error'
  title: string
  description: string
  primary: { label: string; onClick: () => void }
  secondary: { label: string; onClick: () => void }
}

/** Card shown in the middle of the map when there is no route to play. Figma "Empty (no movement)" and "Error". */
export function PlaybackNotice({ tone, title, description, primary, secondary }: NoticeProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 lg:pl-[396px]">
      <div role={tone === 'error' ? 'alert' : 'status'} className={`${FLOAT} pointer-events-auto w-full max-w-[378px] p-7 shadow-[0_12px_32px_rgba(15,27,45,0.16)]`}>
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-xl ${
            tone === 'error' ? 'bg-stopped-bg text-stopped' : 'bg-primary-subtle text-primary'
          }`}
        >
          {tone === 'error' ? <span className="font-semibold">!</span> : <FontAwesomeIcon icon={faRoute} />}
        </div>
        <h2 className="mt-6 text-[17px] font-semibold text-ink">{title}</h2>
        <p className="mt-2 text-[12px] leading-5 text-ink-3">{description}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={primary.onClick}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-6 text-[12px] font-medium text-on-primary hover:bg-primary-hover"
          >
            {primary.label}
          </button>
          <button
            onClick={secondary.onClick}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-6 text-[12px] font-medium text-control hover:bg-surface-muted"
          >
            {secondary.label}
          </button>
        </div>
      </div>
    </div>
  )
}
