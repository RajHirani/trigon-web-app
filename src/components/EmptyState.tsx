import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: IconDefinition
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-line bg-surface px-6 py-[65px] text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-icon-tile text-[25px] text-primary">
        <FontAwesomeIcon icon={icon} />
      </span>
      <h2 className="mt-5 text-xl font-semibold text-ink">{title}</h2>
      <p className="mt-2 max-w-[576px] text-sm text-ink-3">{description}</p>
      <button
        type="button"
        onClick={onAction}
        className="mt-6 h-11 rounded-lg bg-primary px-5 text-[12px] font-medium text-on-primary hover:bg-primary-hover"
      >
        {actionLabel}
      </button>
    </div>
  )
}
