import { faClock, faLinkSlash } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import { Calendar } from '@/components/Calendar'
import { Modal } from '@/components/Modal'
import { addDays, formatDate, startOfDay } from '@/utils/dateRange'
import { formatExpiry } from './geo'
import type { ShareDuration } from './types'
import { useCreateShare, useNowEverySecond, useStopSharing } from './useLiveTrack'

const OPTIONS: { value: ShareDuration; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: 'custom', label: 'Custom' },
]

type Props = { vehicleId: string; onClose: () => void }

/** "Share live location" dialog. Figma: Live Track / Desktop / Light · Share dialog (480px). */
export function ShareDialog({ vehicleId, onClose }: Props) {
  const [duration, setDuration] = useState<ShareDuration>('6h')
  // Custom validity: the user picks the last day; the link then expires at the end of that day.
  const [custom, setCustom] = useState<{ hours: number; until: number } | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerNow] = useState(() => Date.now())
  const lastDuration = useRef<ShareDuration>('6h')
  const [copied, setCopied] = useState(false)
  const create = useCreateShare(vehicleId)
  const stop = useStopSharing(vehicleId)
  const doneRef = useRef<HTMLButtonElement>(null)
  const now = useNowEverySecond()
  const busy = stop.isPending

  // A link is made as soon as the dialog opens, and again whenever the validity changes.
  const { mutate: createLink } = create
  useEffect(() => {
    if (duration === 'custom' && !custom) return // waiting for the user to pick a day
    createLink({ duration, customHours: custom?.hours })
  }, [duration, custom, createLink])

  const link = create.data
  const copy = async () => {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked: the link stays selectable in the field */
    }
  }
  const stopSharing = () => stop.mutate(undefined, { onSuccess: onClose })

  return (
    <Modal title="Share live location" onClose={onClose} busy={busy} showClose className="p-8" initialFocus={doneRef}>
        <p className="mt-2 text-[12px] leading-5 text-ink-3">
          Anyone with the link can follow this vehicle live.
          <br />
          No sign-in needed.
        </p>

        <h3 className="mt-6 text-[10px] font-medium uppercase tracking-wide text-ink-3">Link valid for</h3>
        <div className="relative">
        <div role="radiogroup" aria-label="Link valid for" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OPTIONS.map((o) => {
            const on = o.value === duration
            return (
              <button
                key={o.value}
                role="radio"
                aria-checked={on}
                data-range-trigger={o.value === 'custom' ? '' : undefined}
                onClick={() => {
                  if (o.value === 'custom') setPickerOpen(true)
                  else lastDuration.current = o.value
                  setDuration(o.value)
                }}
                className={`h-10 rounded-lg border text-[12px] font-medium ${
                  on ? 'border-primary bg-primary-subtle text-primary' : 'border-line bg-surface text-control hover:bg-surface-muted'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        {duration === 'custom' && pickerOpen && (
          <ExpiryPopover
            now={pickerNow}
            selected={custom ? startOfDay(custom.until) : startOfDay(pickerNow)}
            onCancel={() => {
              setPickerOpen(false)
              if (!custom) setDuration(lastDuration.current)
            }}
            onPick={(day) => {
              const until = addDays(day, 1) - 1
              const hours = Math.max(1, Math.ceil((until - Date.now()) / 3_600_000))
              setCustom({ hours, until })
              setPickerOpen(false)
            }}
          />
        )}
        </div>
        {duration === 'custom' && !pickerOpen && custom && (
          <p className="mt-3 text-[12px] text-ink-2">
            Valid until end of {formatDate(custom.until)} ·{' '}
            <button type="button" data-range-trigger onClick={() => setPickerOpen(true)} className="font-medium text-primary hover:underline">
              Change
            </button>
          </p>
        )}

        <h3 className="mt-6 text-[10px] font-medium uppercase tracking-wide text-ink-3">Share link</h3>
        <div className="mt-2 flex h-[47px] items-center gap-2 rounded-xl border border-line bg-surface-muted pl-4 pr-1.5">
          <input
            readOnly
            aria-label="Share link"
            value={link?.url ?? (create.isError ? '' : 'Creating link…')}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent text-[12px] text-ink outline-none"
          />
          <button
            onClick={() => void copy()}
            disabled={!link}
            className="h-10 shrink-0 rounded-lg bg-primary px-5 text-[12px] font-medium text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        {create.isError ? (
          <p role="alert" className="mt-3 text-xs text-error-text">
            Couldn’t create the link. Please try again.
          </p>
        ) : (
          <p className="mt-4 flex items-center gap-2 text-xs text-ink-2">
            <FontAwesomeIcon icon={faClock} className="text-primary" />
            {link ? formatExpiry(link.expiresAt, now) : 'Working out the expiry…'}
          </p>
        )}
        {stop.isError && (
          <p role="alert" className="mt-2 text-xs text-error-text">
            Couldn’t stop sharing. Please try again.
          </p>
        )}

        <div className="mt-8 flex items-center justify-between gap-3">
          <button
            onClick={stopSharing}
            disabled={busy || !link}
            className="inline-flex h-12 items-center gap-2 rounded-xl border border-error-border bg-surface px-5 text-sm font-medium text-error-text hover:bg-error-bg disabled:opacity-60"
          >
            <FontAwesomeIcon icon={faLinkSlash} />
            {busy ? 'Stopping…' : 'Stop sharing'}
          </button>
          <button
            ref={doneRef}
            onClick={onClose}
            disabled={busy}
            className="h-12 min-w-28 rounded-xl bg-surface-muted px-6 text-sm font-semibold text-ink hover:bg-line"
          >
            Done
          </button>
        </div>
    </Modal>
  )
}

/** Floating calendar under the duration buttons: picking a day sets the expiry and closes it. */
function ExpiryPopover({ now, selected, onPick, onCancel }: { now: number; selected: number; onPick: (day: number) => void; onCancel: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const t = e.target as Element
      if (!ref.current?.contains(t) && !t.closest('[data-range-trigger]')) onCancel()
    }
    // Capture + stop so Escape closes only this popup, not the whole dialog.
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
  const today = startOfDay(now)
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Choose when the link expires"
      className="absolute right-0 top-full z-10 mt-2 w-[min(340px,100%)] rounded-2xl border border-line bg-surface p-4 shadow-[0_12px_32px_rgba(15,27,45,0.18)]"
    >
      <Calendar start={selected} end={null} onPick={onPick} minDate={today} maxDate={null} initialMonth={selected} />
      <p className="mt-2 text-[10px] text-ink-3">Pick the last day. The link stops working at the end of it.</p>
    </div>
  )
}
