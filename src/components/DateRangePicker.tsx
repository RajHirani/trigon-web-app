import { useEffect, useRef, useState, type ReactNode } from 'react'
import { addDays, dayCount, formatDate, startOfDay } from '@/utils/dateRange'
import { Calendar } from './Calendar'

export type DateRange = { from: number; to: number }
export type DateRangeProblem = 'tooLong' | 'invalid'

const shortDay = (ms: number) => `${new Date(ms).getDate()} ${new Date(ms).toLocaleDateString('en-GB', { month: 'short' })}`

type Props = {
  /** Accessible name of the popup. */
  label?: string
  initial: DateRange
  /** "Now" in ms; the latest selectable moment. */
  now: number
  /** Longest period in whole days. */
  maxDays: number
  /** Hint under the summary line. */
  hint?: ReactNode
  /** Replaces the hint when the selection is longer than `maxDays`. */
  tooLongHint?: ReactNode
  /** Summary suffix: "{n} days" by default. */
  applyLabel?: string
  /** Placement / shape classes. Default floats it as an absolute popover. */
  className?: string
  onCancel: () => void
  onApply: (range: DateRange) => void
  /** Reports the live selection (null on close) so a host can mirror it. */
  onDraft?: (draft: (DateRange & { problem: DateRangeProblem | null }) | null) => void
}

/**
 * Common period picker built on <Calendar>: pick a start and an end day, see "14 Oct – 20 Oct 2026 · 7 days",
 * Cancel / Apply. Ends at "now" when the last day is today, otherwise at the end of the last day.
 * Closes on Escape or a click outside (elements marked `data-range-trigger` are ignored, so their own toggle works).
 */
export function DateRangePicker({
  label = 'Choose a period',
  initial,
  now,
  maxDays,
  hint,
  tooLongHint,
  applyLabel = 'Apply',
  className = 'absolute z-20 w-[min(380px,calc(100vw-32px))]',
  onCancel,
  onApply,
  onDraft,
}: Props) {
  const today = startOfDay(now)
  const [startDay, setStartDay] = useState(startOfDay(initial.from))
  const [endDay, setEndDay] = useState<number | null>(startOfDay(initial.to))
  const ref = useRef<HTMLDivElement>(null)

  const lastDay = endDay ?? startDay
  const from = startDay
  const to = lastDay < today ? addDays(lastDay, 1) - 1 : now
  const days = dayCount(from, to)
  const problem: DateRangeProblem | null = days > maxDays ? 'tooLong' : to <= from ? 'invalid' : null

  useEffect(() => {
    onDraft?.({ from, to, problem })
  }, [from, to, problem, onDraft])
  useEffect(() => () => onDraft?.(null), [onDraft])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (!ref.current?.contains(t) && !t.closest('[data-range-trigger]')) onCancel()
    }
    // Capture + stop so a host dialog's own Escape handler doesn't close the whole dialog too.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onCancel()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [onCancel])

  const pick = (day: number) => {
    // With a finished selection, or a click before the start, this day starts a new one; otherwise it ends it.
    if (endDay !== null || day < startDay) {
      setStartDay(day)
      setEndDay(null)
      return
    }
    setEndDay(day)
  }

  const summary = days <= 1 && startDay === lastDay ? formatDate(startDay) : `${shortDay(startDay)} – ${formatDate(lastDay)}`

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label={label}
      className={`overflow-y-auto rounded-2xl border border-line bg-surface shadow-[0_12px_32px_rgba(15,27,45,0.18)] ${className}`}
    >
      <div className="px-5 pb-3 pt-4">
        <Calendar
          start={startDay}
          end={endDay === null ? null : lastDay}
          onPick={pick}
          maxDate={now}
          initialMonth={initial.to}
        />
      </div>

      <div className="border-t border-line px-5 pb-5 pt-3.5">
        {problem === 'tooLong' && tooLongHint ? (
          <>
            <div className="text-[13px] font-semibold text-stopped-fg">
              {days} days selected · max is {maxDays} days
            </div>
            <div className="mt-1 text-[11px] text-ink-3">{tooLongHint}</div>
          </>
        ) : (
          <>
            <div className={`text-[13px] font-semibold ${problem ? 'text-stopped-fg' : 'text-ink'}`}>
              {problem === 'tooLong' ? `${days} days selected · max is ${maxDays} days` : `${summary} · ${days} ${days === 1 ? 'day' : 'days'}`}
            </div>
            {hint && <div className="mt-1 text-[11px] text-ink-3">{hint}</div>}
          </>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface text-[13px] font-medium text-control hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={problem !== null}
            onClick={() => onApply({ from, to })}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-[13px] font-medium text-on-primary hover:bg-primary-hover disabled:bg-primary/30 disabled:hover:bg-primary/30"
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
