import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useMemo, useState } from 'react'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const startOfDay = (ms: number) => {
  const d = new Date(ms)
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}
const monthIndex = (ms: number) => new Date(ms).getFullYear() * 12 + new Date(ms).getMonth()
const dayLabel = (ms: number) => new Date(ms).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

type Props = {
  /** Selected start day (local midnight, ms). For a single day pass `end = null`. */
  start: number
  /** Selected end day; null while only the start is picked. */
  end: number | null
  /** Called with the clicked day (local midnight, ms). The parent decides how that changes start/end. */
  onPick: (day: number) => void
  /** Last selectable day; later days are disabled. Defaults to today; null allows any future day. */
  maxDate?: number | null
  /** First selectable day; earlier days are disabled. */
  minDate?: number
  /** Month shown first (any ms inside it). Defaults to the end, else the start. */
  initialMonth?: number
}

/**
 * Common month calendar with single-day or range highlighting. It only renders and reports clicks;
 * selection rules (max length etc.) stay with the caller. The period picker and date fields build on it.
 */
export function Calendar({ start, end, onPick, maxDate, minDate, initialMonth }: Props) {
  const [now] = useState(() => Date.now())
  const max = maxDate === null ? null : startOfDay(maxDate ?? now)
  const min = minDate === undefined ? undefined : startOfDay(minDate)
  const [view, setView] = useState(() => {
    const d = new Date(initialMonth ?? end ?? start)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const last = end ?? start

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const count = new Date(view.y, view.m + 1, 0).getDate()
    return [...Array<null>(first.getDay()).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.y, view.m, i + 1).getTime())]
  }, [view])

  const here = view.y * 12 + view.m
  const shift = (by: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + by) / 12), m: (((m + by) % 12) + 12) % 12 }))
  const arrow = 'flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-muted disabled:opacity-30 disabled:hover:bg-transparent'

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={min !== undefined && here <= monthIndex(min)}
          aria-label="Previous month"
          className={arrow}
        >
          <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
        </button>
        <div className="text-sm font-semibold text-ink" aria-live="polite">
          {MONTH_NAMES[view.m]} {view.y}
        </div>
        <button type="button" onClick={() => shift(1)} disabled={max !== null && here >= monthIndex(max)} aria-label="Next month" className={arrow}>
          <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 text-center text-[10px] font-medium text-ink-3">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="h-8 leading-8">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 text-center text-[12px]">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} />
          const disabled = (max !== null && day > max) || (min !== undefined && day < min)
          const isStart = day === start
          const isEnd = day === last
          const inside = day >= start && day <= last
          return (
            <div
              key={day}
              className={`flex h-10 items-center justify-center ${inside ? 'bg-primary-subtle' : ''} ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''}`}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(day)}
                aria-pressed={isStart || isEnd}
                aria-label={dayLabel(day)}
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  isStart || isEnd ? 'bg-primary font-medium text-on-primary' : disabled ? 'text-ink-3/40' : 'text-ink hover:bg-primary-subtle'
                }`}
              >
                {new Date(day).getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
