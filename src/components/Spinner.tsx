/** Small inline spinner for buttons and short waits. Inherits the text colour. */
export function Spinner({ size = 16, label = 'Loading' }: { size?: number; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      style={{ width: size, height: size }}
      className="inline-block shrink-0 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin"
    />
  )
}

/** Generic placeholder block; size and shape come from `className`. Pulses only when motion is allowed. */
export function Skeleton({ className = '', soft = false }: { className?: string; soft?: boolean }) {
  return <div aria-hidden className={`motion-safe:animate-pulse ${soft ? 'bg-skeleton-soft' : 'bg-skeleton'} ${className}`} />
}
