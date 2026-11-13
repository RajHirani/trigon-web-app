import { useId, type ReactNode } from 'react'
import { Modal, ModalActions } from './Modal'

type Props = {
  title: ReactNode
  message: ReactNode
  confirmLabel: string
  /** Shown on the confirm button while `pending` (e.g. "Locking…"). */
  pendingLabel?: string
  pending?: boolean
  /** Inline error banner text; nothing is shown when empty. */
  error?: string
  /** Colour of the "!" badge. */
  tone?: 'warning' | 'danger'
  onCancel: () => void
  onConfirm: () => void
}

/** Common confirmation popup (Cancel + primary action), built on <Modal>. */
export function ConfirmDialog({ title, message, confirmLabel, pendingLabel, pending = false, error, tone = 'warning', onCancel, onConfirm }: Props) {
  const bodyId = useId()
  return (
    <Modal
      title={title}
      onClose={onCancel}
      busy={pending}
      describedBy={bodyId}
      icon={
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full text-[20px] font-bold ${
            tone === 'danger' ? 'bg-error-bg text-error-text' : 'bg-idle-bg text-idle-fg'
          }`}
        >
          !
        </span>
      }
    >
      <p id={bodyId} className="mt-2 text-sm text-ink-3">
        {message}
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-error-border bg-error-bg px-3 py-2 text-[12px] text-error-text">
          {error}
        </p>
      )}
      <ModalActions>
        <button
          data-autofocus
          type="button"
          disabled={pending}
          onClick={onCancel}
          className="h-[41px] rounded-xl border border-line bg-surface px-6 text-sm font-medium text-control hover:bg-surface-muted disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="h-[41px] rounded-xl bg-primary px-6 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-70"
        >
          {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
        </button>
      </ModalActions>
    </Modal>
  )
}
