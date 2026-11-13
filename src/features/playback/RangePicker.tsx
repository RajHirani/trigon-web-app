import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDays, dayCount, formatDate, MAX_DAYS, rangeProblem, startOfDay } from './range'
import type { PlaybackRange, RangeDraft } from './types'

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

const shortDay = (ms: number) => `${new Date(ms).getDate()} ${new Date(ms).toLocaleDateString('en-GB', { month: 'short' })}`

type Props = {
  initial: PlaybackRange
  now: number
  onCancel: () => void
  onApply: (range: PlaybackRange) => void
  /** Reports what is selected so the panel's range card can show it live. */
  onDraft: (draft: RangeDraft | null) => void
}

/** Custom period picker (up to 7 days). Figma "Custom range picker" and "Range over 7 days". */
export function RangePicker({ initial, now, onCancel, onApply, onDraft }: Props) {
  const today = startOfDay(now)
  const [view, setView] = useState(() => {
    const d = new Date(initial.to)
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [startDay, setStartDay] = useState(startOfDay(initial.from))
  const [endDay, setEndDay] = useState<number | null>(startOfDay(initial.to))
  const ref = useRef<HTMLDivElement>(null)

  const lastDay = endDay ?? startDay
  // Whole days: from the start of the first day to the end of the last one (or to now when that is today).
  const from = startDay
  const to = lastDay >= today ? now : addDays(lastDay, 1) - 1
  const days = dayCount(from, to)
  const problem = rangeProblem(from, to, now)

  useEffect(() => {
    onDraft({ from, to, tooLong: problem === 'tooLong' })
  }, [from, to, problem, onDraft])
  useEffect(() => () => onDraft(null), [onDraft])

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (!ref.current?.contains(t) && !t.closest('[data-range-trigger]')) onCancel()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [onCancel])

  const cells = useMemo(() => {
    const first = new Date(view.y, view.m, 1)
    const count = new Date(view.y, view.m + 1, 0).getDate()
    return [...Array<null>(first.getDay()).fill(null), ...Array.from({ length: count }, (_, i) => new Date(view.y, view.m, i + 1).getTime())]
  }, [view])

  const pick = (day: number) => {
    // With a finished selection, or a click before the start, this day starts a new one; otherwise it ends it.
    if (endDay !== null || day < startDay) {
      setStartDay(day)
      setEndDay(null)
      return
    }
    setEndDay(day)
  }

  const nextDisabled = view.y * 12 + view.m >= new Date(now).getFullYear() * 12 + new Date(now).getMonth()
  const shift = (by: number) => setView(({ y, m }) => ({ y: y + Math.floor((m + by) / 12), m: (((m + by) % 12) + 12) % 12 }))

  const label =
    days <= 1 && startDay === lastDay ? formatDate(startDay) : `${shortDay(startDay)} – ${formatDate(lastDay)}`

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Choose a period"
      className="absolute z-20 max-h-[calc(100vh-132px)] w-[min(380px,calc(100vw-32px))] overflow-y-auto rounded-2xl border border-line bg-surface shadow-[0_12px_32px_rgba(15,27,45,0.18)] max-lg:left-0 max-lg:top-[150px] lg:left-full lg:top-0 lg:ml-4 lg:[@media(min-height:880px)]:top-[123px]"
    >
      <div className="px-5 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-muted"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
          </button>
          <div className="text-sm font-semibold text-ink">
            {MONTH_NAMES[view.m]} {view.y}
          </div>
          <button
            onClick={() => shift(1)}
            disabled={nextDisabled}
            aria-label="Next month"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-muted disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-7 text-center text-[11px] font-medium text-ink-3">
          {WEEKDAYS.map((d, i) => (
            <div key={i} className="h-8 leading-8">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 text-center text-[13px]">
          {cells.map((day, i) => {
            if (day === null) return <div key={`b${i}`} />
            const future = day > today
            const isStart = day === startDay
            const isEnd = day === lastDay
            const inside = day >= startDay && day <= lastDay
            return (
              <div
                key={day}
                className={`flex h-10 items-center justify-center ${inside ? 'bg-primary-subtle' : ''} ${isStart ? 'rounded-l-full' : ''} ${isEnd ? 'rounded-r-full' : ''}`}
              >
                <button
                  disabled={future}
                  onClick={() => pick(day)}
                  aria-pressed={isStart || isEnd}
                  aria-label={formatDate(day)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full ${
                    isStart || isEnd
                      ? 'bg-primary font-medium text-on-primary'
                      : future
                        ? 'text-ink-3/40'
                        : 'text-ink hover:bg-primary-subtle'
                  }`}
                >
                  {new Date(day).getDate()}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      <div className="border-t border-line px-5 pb-5 pt-3.5">
        {problem === 'tooLong' ? (
          <>
            <div className="text-[13px] font-semibold text-stopped-fg">
              {days} days selected · max is {MAX_DAYS} days
            </div>
            <div className="mt-1 text-[11px] text-ink-3">Need a longer period? Reports are prepared and emailed.</div>
            <Link to="/reports" className="mt-1.5 inline-block text-xs font-medium text-primary hover:underline">
              Request a Trip report →
            </Link>
          </>
        ) : (
          <>
            <div className="text-[13px] font-semibold text-ink">
              {label} · {days} {days === 1 ? 'day' : 'days'}
            </div>
            <div className="mt-1 text-[11px] text-ink-3">Playback covers up to {MAX_DAYS} days at a time.</div>
          </>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface text-[13px] font-medium text-control hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            disabled={problem !== null}
            onClick={() => onApply({ preset: 'custom', from, to })}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-primary text-[13px] font-medium text-on-primary hover:bg-primary-hover disabled:bg-primary/30 disabled:hover:bg-primary/30"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
