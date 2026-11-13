import { pageItems } from './format'

type Props = {
  page: number
  pageCount: number
  pageSize: number
  onChange: (page: number) => void
  /** First load: the pager is shown for layout but cannot be used. */
  loading?: boolean
}

const BTN = 'flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-[13px] font-medium'

export function Pagination({ page, pageCount, pageSize, onChange, loading = false }: Props) {
  return (
    <nav aria-label="Pagination" aria-busy={loading} className={`flex flex-wrap items-center justify-between gap-3 ${loading ? 'pointer-events-none' : ''}`}>
      <p className="text-[13px] text-ink-3">
        Page {page} of {pageCount} · {pageSize} vehicles per page
      </p>
      <div className="flex items-center gap-2">
        <button
          aria-label="Previous page"
          disabled={loading || page <= 1}
          onClick={() => onChange(page - 1)}
          className={`${BTN} border-line bg-surface text-ink-2 enabled:hover:bg-surface-muted disabled:opacity-40`}
        >
          ‹
        </button>
        {pageItems(page, pageCount).map((p, i) =>
          p === 'gap' ? (
            <span key={`gap${i}`} className="w-6 text-center text-ink-3">
              …
            </span>
          ) : (
            <button
              key={p}
              aria-current={p === page ? 'page' : undefined}
              disabled={loading}
              onClick={() => onChange(p)}
              className={`${BTN} ${p === page ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink hover:bg-surface-muted'}`}
            >
              {p}
            </button>
          ),
        )}
        <button
          aria-label="Next page"
          disabled={loading || page >= pageCount}
          onClick={() => onChange(page + 1)}
          className={`${BTN} border-line bg-surface text-ink-2 enabled:hover:bg-surface-muted disabled:opacity-40`}
        >
          ›
        </button>
      </div>
    </nav>
  )
}
