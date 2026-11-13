import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { DateRangePicker } from '@/components/DateRangePicker'
import { MAX_DAYS } from './range'
import type { PlaybackRange, RangeDraft } from './types'

type Props = {
  initial: PlaybackRange
  now: number
  onCancel: () => void
  onApply: (range: PlaybackRange) => void
  /** Reports what is selected so the panel's range card can show it live. */
  onDraft: (draft: RangeDraft | null) => void
}

/** Playback's custom period picker (up to 7 days): the common DateRangePicker placed beside the panel. Figma "Custom range picker" and "Range over 7 days". */
export function RangePicker({ initial, now, onCancel, onApply, onDraft }: Props) {
  const draft = useCallback(
    (d: { from: number; to: number; problem: 'tooLong' | 'invalid' | null } | null) =>
      onDraft(d && { from: d.from, to: d.to, tooLong: d.problem === 'tooLong' }),
    [onDraft],
  )
  return (
    <DateRangePicker
      initial={initial}
      now={now}
      maxDays={MAX_DAYS}
      className="absolute z-20 max-h-[calc(100vh-132px)] w-[min(380px,calc(100vw-32px))] max-lg:left-0 max-lg:top-[135px] lg:left-full lg:top-0 lg:ml-4 lg:[@media(min-height:880px)]:top-[111px]"
      hint={`Playback covers up to ${MAX_DAYS} days at a time.`}
      tooLongHint={
        <>
          Need a longer period? Reports are prepared and emailed.
          <Link to="/reports" className="mt-1.5 block text-xs font-medium text-primary hover:underline">
            Request a Trip report →
          </Link>
        </>
      }
      onCancel={onCancel}
      onApply={(r) => onApply({ preset: 'custom', ...r })}
      onDraft={draft}
    />
  )
}
