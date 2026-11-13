import { faClock, faLinkSlash, faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import { formatExpiry } from './geo'
import type { ShareDuration } from './types'
import { useCreateShare, useNowEverySecond, useStopSharing } from './useLiveTrack'

const OPTIONS: { value: ShareDuration; label: string }[] = [
  { value: '1h', label: '1 hour' },
  { value: '6h', label: '6 hours' },
  { value: '24h', label: '24 hours' },
  { value: 'custom', label: 'Custom' },
]
const DEFAULT_CUSTOM_HOURS = 12
const MAX_CUSTOM_HOURS = 168

type Props = { vehicleId: string; onClose: () => void }

/** "Share live location" dialog. Figma: Live Track / Desktop / Light · Share dialog (480px). */
export function ShareDialog({ vehicleId, onClose }: Props) {
  const [duration, setDuration] = useState<ShareDuration>('6h')
  const [customHours, setCustomHours] = useState(DEFAULT_CUSTOM_HOURS)
  const [copied, setCopied] = useState(false)
  const create = useCreateShare(vehicleId)
  const stop = useStopSharing(vehicleId)
  const doneRef = useRef<HTMLButtonElement>(null)
  const now = useNowEverySecond()
  const busy = stop.isPending

  // A link is made as soon as the dialog opens, and again whenever the validity changes.
  const { mutate: createLink } = create
  useEffect(() => {
    const hours = Math.min(MAX_CUSTOM_HOURS, Math.max(1, Math.round(customHours) || 1))
    createLink({ duration, customHours: hours })
  }, [duration, customHours, createLink])

  useEffect(() => doneRef.current?.focus(), [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        className="w-full max-w-[480px] rounded-3xl bg-surface p-8 shadow-[0_16px_40px_rgba(15,27,45,0.25)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="share-title" className="text-xl font-semibold text-ink">
            Share live location
          </h2>
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="-mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-muted"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
        <p className="mt-2 text-[13px] leading-5 text-ink-3">
          Anyone with the link can follow this vehicle live.
          <br />
          No sign-in needed.
        </p>

        <h3 className="mt-6 text-[11px] font-medium uppercase tracking-wide text-ink-3">Link valid for</h3>
        <div role="radiogroup" aria-label="Link valid for" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {OPTIONS.map((o) => {
            const on = o.value === duration
            return (
              <button
                key={o.value}
                role="radio"
                aria-checked={on}
                onClick={() => setDuration(o.value)}
                className={`h-10 rounded-lg border text-[13px] font-medium ${
                  on ? 'border-primary bg-primary-subtle text-primary' : 'border-line bg-surface text-control hover:bg-surface-muted'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
        {duration === 'custom' && (
          // TODO(design): Custom has no Figma frame; a simple hours field stands in.
          <label className="mt-3 flex items-center gap-3 text-[13px] text-ink-2">
            Valid for
            <input
              type="number"
              min={1}
              max={MAX_CUSTOM_HOURS}
              value={customHours}
              onChange={(e) => setCustomHours(Number(e.target.value))}
              className="h-10 w-24 rounded-lg border border-line bg-input px-3 text-ink"
            />
            hours (up to {MAX_CUSTOM_HOURS})
          </label>
        )}

        <h3 className="mt-6 text-[11px] font-medium uppercase tracking-wide text-ink-3">Share link</h3>
        <div className="mt-2 flex h-[52px] items-center gap-2 rounded-xl border border-line bg-surface-muted pl-4 pr-1.5">
          <input
            readOnly
            aria-label="Share link"
            value={link?.url ?? (create.isError ? '' : 'Creating link…')}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none"
          />
          <button
            onClick={() => void copy()}
            disabled={!link}
            className="h-10 shrink-0 rounded-lg bg-primary px-5 text-[13px] font-medium text-on-primary hover:bg-primary-hover disabled:opacity-60"
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
      </div>
    </div>
  )
}
