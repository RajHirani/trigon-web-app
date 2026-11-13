import { faArrowLeft, faLayerGroup, faLocationCrosshairs, faRoute } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useEffect, useRef, useState } from 'react'
import type { Vehicle } from '@/features/dashboard/types'
import { StatusPill } from '@/components/vehicle/VehicleParts'
import { formatAgoSeconds, formatClock } from './geo'
import { MAP_LAYERS, type MapLayer } from './types'

const FLOAT = 'rounded-2xl border border-line bg-surface shadow-[0_8px_24px_rgba(15,27,45,0.12)]'

type HeaderProps = { vehicle: Vehicle; updatedAt: string; now: number; onBack: () => void }

/** Top-left card: back, plate, status, live indicator. Figma "Live Header". */
export function LiveHeader({ vehicle, updatedAt, now, onBack }: HeaderProps) {
  const offline = vehicle.status === 'offline'
  return (
    <div className={`${FLOAT} flex flex-wrap items-center gap-x-4 gap-y-2 px-3.5 py-3.5 lg:h-[68px] lg:flex-nowrap lg:py-0`}>
      <button
        onClick={onBack}
        aria-label="Back"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink hover:bg-line"
      >
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <div className="min-w-0 flex-1 basis-40">
        <div className="truncate text-lg font-semibold leading-[27px] text-ink">{vehicle.plate}</div>
        <div className="truncate text-xs text-ink-3">
          {vehicle.vehicleType} · {vehicle.owner}
        </div>
      </div>
      <StatusPill status={vehicle.status} />
      <div className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl bg-surface-muted px-3.5 py-1.5 text-[13px] font-medium text-ink">
        <span className={`h-2 w-2 shrink-0 rounded-full ${offline ? 'bg-offline' : 'bg-moving'}`} />
        <span className="min-w-0">
          {offline ? 'Offline · last seen' : 'Live · updated'} {formatAgoSeconds(updatedAt, now)}
        </span>
      </div>
    </div>
  )
}

const CTRL = `${FLOAT} flex h-11 w-11 items-center justify-center text-control hover:bg-surface-muted`

type ControlsProps = {
  follow?: boolean
  showPath?: boolean
  layer: MapLayer
  onZoomIn: () => void
  onZoomOut: () => void
  /** Omit to hide the Follow button (Playback hides it when there is no route). */
  onToggleFollow?: () => void
  /** Omit to hide the Today's path button (Playback has no such switch). */
  onTogglePath?: () => void
  onLayerChange: (l: MapLayer) => void
}

function LayerPicker({ layer, onChange }: { layer: MapLayer; onChange: (l: MapLayer) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Map style"
        aria-expanded={open}
        title="Map style"
        className={`${CTRL} ${open ? '!bg-primary-subtle !text-primary' : ''}`}
      >
        <FontAwesomeIcon icon={faLayerGroup} />
      </button>
      {open && (
        <div role="radiogroup" aria-label="Map style" className={`${FLOAT} absolute right-full top-0 mr-3 w-44 p-1.5`}>
          {MAP_LAYERS.map((l) => (
            <button
              key={l.value}
              role="radio"
              aria-checked={l.value === layer}
              onClick={() => {
                onChange(l.value)
                setOpen(false)
              }}
              className={`flex h-9 w-full items-center rounded-lg px-3 text-[13px] ${
                l.value === layer ? 'bg-primary-subtle font-medium text-primary' : 'text-control hover:bg-surface-muted'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Right-hand map buttons. Figma "Map Zoom / Layers / Follow / Today's Path" + "Tooltip / Follow". */
export function MapControls(p: ControlsProps) {
  return (
    <div className="flex flex-col items-end gap-3">
      <div className={`${FLOAT} flex w-11 flex-col overflow-hidden`}>
        <button onClick={p.onZoomIn} aria-label="Zoom in" className="h-[42.5px] text-xl text-ink hover:bg-surface-muted">
          +
        </button>
        <div className="mx-2 h-px bg-line" />
        <button onClick={p.onZoomOut} aria-label="Zoom out" className="h-[42.5px] text-xl text-ink hover:bg-surface-muted">
          −
        </button>
      </div>

      <LayerPicker layer={p.layer} onChange={p.onLayerChange} />

      {p.onToggleFollow && (
        <div className="group relative">
          <span
            role="tooltip"
            className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-ink px-3 py-1 text-xs font-medium text-surface opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
          >
            {p.follow ? 'Following vehicle' : 'Follow vehicle'}
          </span>
          <button
            onClick={p.onToggleFollow}
            aria-label={p.follow ? 'Following vehicle' : 'Follow vehicle'}
            aria-pressed={p.follow}
            className={`${CTRL} ${p.follow ? '!border-primary !bg-primary !text-on-primary hover:!bg-primary-hover' : ''}`}
          >
            <FontAwesomeIcon icon={faLocationCrosshairs} />
          </button>
        </div>
      )}

      {p.onTogglePath && (
        <button
          onClick={p.onTogglePath}
          aria-label="Today's path"
          aria-pressed={p.showPath}
          title={p.showPath ? 'Hide today’s path' : 'Show today’s path'}
          className={`${CTRL} ${p.showPath ? '!bg-primary-subtle !text-primary' : ''}`}
        >
          <FontAwesomeIcon icon={faRoute} />
        </button>
      )}
    </div>
  )
}

/** Bottom-centre legend with the path switch. Figma "Path Legend". */
export function PathLegend({ since, on, onToggle }: { since: string; on: boolean; onToggle: () => void }) {
  return (
    <div className={`${FLOAT} flex h-11 w-[248px] items-center gap-3.5 pl-4 pr-3`}>
      <span className={`h-1 w-7 shrink-0 rounded-full ${on ? 'bg-primary' : 'bg-switch-off'}`} />
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold leading-5 text-ink">Today’s path</div>
        <div className="text-[11px] leading-[14px] text-ink-3">Since {formatClock(since)}</div>
      </div>
      <button
        role="switch"
        aria-checked={on}
        aria-label="Show today's path"
        onClick={onToggle}
        className={`relative h-[22px] w-10 shrink-0 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-switch-off'}`}
      >
        <span
          className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-[left] ${on ? 'left-[21px]' : 'left-[3px]'}`}
        />
      </button>
    </div>
  )
}
