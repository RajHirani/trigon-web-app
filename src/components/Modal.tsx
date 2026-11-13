import { faXmark } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useId, useRef, type ReactNode, type RefObject } from 'react'

type Props = {
  title: ReactNode
  onClose: () => void
  children: ReactNode
  /** Locks closing (Escape, backdrop, X) while an action is running. */
  busy?: boolean
  /** Shows the X button next to the title. */
  showClose?: boolean
  /** Panel width class, e.g. "max-w-[432px]" (default). */
  widthClass?: string
  /** Panel padding / extra classes. */
  className?: string
  /** Id of the description element, forwarded to aria-describedby. */
  describedBy?: string
  /** Optional node rendered above the title (an icon badge). */
  icon?: ReactNode
  /** Focus this element on open; otherwise the first [data-autofocus] element, otherwise the panel. */
  initialFocus?: RefObject<HTMLElement | null>
}

/**
 * Common modal popup: scrim, centred panel, Escape / backdrop to close, focus on open, aria wiring.
 * Put the body in `children`; use <ModalActions> for the footer buttons.
 */
export function Modal({
  title,
  onClose,
  children,
  busy = false,
  showClose = false,
  widthClass = 'max-w-[432px]',
  className = 'p-6 sm:p-8',
  describedBy,
  icon,
  initialFocus,
}: Props) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = initialFocus?.current ?? panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? panel.current
    el?.focus()
    // Only on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim p-4" onClick={() => !busy && onClose()}>
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        className={`w-full ${widthClass} rounded-3xl bg-surface shadow-[0_16px_40px_rgba(15,27,45,0.25)] outline-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {icon}
        <div className={`flex items-start justify-between gap-4 ${icon ? 'mt-5' : ''}`}>
          <h2 id={titleId} className="text-xl font-semibold text-ink">
            {title}
          </h2>
          {showClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="-mr-1 flex h-7 w-7 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-muted"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

/** Footer row for a Modal. */
export function ModalActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mt-8 flex justify-end gap-2.5 ${className}`}>{children}</div>
}
