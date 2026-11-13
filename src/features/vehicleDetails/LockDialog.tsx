import { useEffect, useRef } from 'react'

type Props = {
  plate: string
  pending: boolean
  error: boolean
  onCancel: () => void
  onConfirm: () => void
}

// "Lock device" confirmation. Figma: Dashboard / Desktop / Light · View More · Lock device dialog (480px).
export function LockDialog({ plate, pending, error, onCancel, onConfirm }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !pending && onCancel()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pending, onCancel])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4"
      onClick={() => !pending && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lock-title"
        aria-describedby="lock-body"
        className="w-full max-w-[480px] rounded-3xl bg-surface p-6 shadow-[0_16px_40px_rgba(15,27,45,0.25)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-idle-bg text-[22px] font-bold text-idle-fg">
          !
        </span>
        <h2 id="lock-title" className="mt-5 text-xl font-semibold text-ink">
          Lock {plate}?
        </h2>
        <p id="lock-body" className="mt-2 text-sm text-ink-3">
          The device will be locked. You can switch it back to unlocked from this page whenever you need.
        </p>
        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-error-border bg-error-bg px-3 py-2 text-[13px] text-error-text">
            Couldn’t lock the device. Please try again.
          </p>
        )}
        <div className="mt-8 flex justify-end gap-2.5">
          <button
            ref={cancelRef}
            type="button"
            disabled={pending}
            onClick={onCancel}
            className="h-[46px] rounded-xl border border-line bg-surface px-6 text-sm font-medium text-control hover:bg-surface-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onConfirm}
            className="h-[46px] rounded-xl bg-primary px-6 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-70"
          >
            {pending ? 'Locking…' : 'Lock device'}
          </button>
        </div>
      </div>
    </div>
  )
}
