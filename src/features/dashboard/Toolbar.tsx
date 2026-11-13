import { faCheck, faChevronDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'

const FIELD = 'h-11 rounded-xl border border-line bg-surface text-[12px] text-ink'

export function SearchBox({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) {
  return (
    <label className={`${FIELD} flex w-full items-center gap-3 px-4 focus-within:border-primary sm:max-w-[342px]`}>
      <FontAwesomeIcon icon={faMagnifyingGlass} className="text-ink-3" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
        placeholder="Search by plate number…"
        aria-label="Search by plate number"
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-placeholder"
      />
    </label>
  )
}

type DeviceTypeProps = { options: string[]; selected: string | null; onSelect: (v: string | null) => void }

/** "Device type: All" dropdown with a search box and a tick on the chosen option. */
export function DeviceTypeFilter({ options, selected, onSelect }: DeviceTypeProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const shown = options.filter((o) => o.toLowerCase().includes(query.trim().toLowerCase()))
  const pick = (v: string | null) => {
    onSelect(v)
    setOpen(false)
    setQuery('')
  }
  const row = (active: boolean) =>
    `flex h-11 w-full items-center justify-between rounded-lg px-3 text-left text-[12px] ${
      active ? 'bg-selected font-semibold text-primary' : 'text-ink hover:bg-surface-muted'
    }`

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`${FIELD} flex items-center gap-3 px-4 font-medium ${open ? 'border-primary' : ''}`}
      >
        Device type: {selected ?? 'All'}
        <FontAwesomeIcon icon={faChevronDown} className="text-xs text-ink-3" />
      </button>
      {open && (
        <div className="absolute left-0 top-[47px] z-20 w-[270px] rounded-xl border border-line bg-surface p-2 shadow-lg">
          <label className="mb-1 flex h-10 items-center gap-2 rounded-lg bg-surface-muted px-3 text-[12px]">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-ink-3" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search device type…"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-placeholder"
            />
          </label>
          <ul role="listbox" className="max-h-60 overflow-y-auto">
            {!query && (
              <li>
                <button role="option" aria-selected={selected === null} className={row(selected === null)} onClick={() => pick(null)}>
                  All device types
                  {selected === null && <FontAwesomeIcon icon={faCheck} />}
                </button>
              </li>
            )}
            {shown.map((o) => (
              <li key={o}>
                <button role="option" aria-selected={selected === o} className={row(selected === o)} onClick={() => pick(o)}>
                  {o}
                  {selected === o && <FontAwesomeIcon icon={faCheck} />}
                </button>
              </li>
            ))}
            {shown.length === 0 && <li className="px-3 py-3 text-[12px] text-ink-3">No device types match.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
