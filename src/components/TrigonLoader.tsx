import { useEffect, useRef, useState } from 'react'
import type { VehicleKind } from '@/features/liveTrack/vehicleIcons'

// Common Trigon loader: the logo assembles, then a vehicle drives a route on a small map while three
// step bars fill. Ported from the mobile app's TrigonLoader (same geometry, timings and sprites).

const LOOP_MS = 5000
const PING_MS = 1600
const DRIVE_END = 0.9 // the vehicle arrives at 90 % of the loop, then waits
const SLOW_AFTER_MS = 15_000

// ---- route geometry (map units, 320 x 200) ---------------------------------
const MAP = { width: 320, height: 200 }
const ROUTE_D = 'M24 160 C 70 160 80 100 130 100 C 180 100 170 150 218 138 C 262 128 250 56 292 42'
const START = { x: 24, y: 160 }
const DEST = { x: 292, y: 42 }
const CURVES: number[][] = [
  [24, 160, 70, 160, 80, 100, 130, 100],
  [130, 100, 180, 100, 170, 150, 218, 138],
  [218, 138, 262, 128, 250, 56, 292, 42],
]
const STEPS = 80
const DENSE = 40

// The route sampled at even distances (position + heading), so the vehicle drives at constant speed.
const ROUTE = (() => {
  const dense: { x: number; y: number }[] = []
  CURVES.forEach(([x0, y0, x1, y1, x2, y2, x3, y3], c) => {
    for (let i = c === 0 ? 0 : 1; i <= DENSE; i++) {
      const t = i / DENSE
      const u = 1 - t
      dense.push({
        x: u ** 3 * x0! + 3 * u * u * t * x1! + 3 * u * t * t * x2! + t ** 3 * x3!,
        y: u ** 3 * y0! + 3 * u * u * t * y1! + 3 * u * t * t * y2! + t ** 3 * y3!,
      })
    }
  })
  const cum = [0]
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1]! + Math.hypot(dense[i]!.x - dense[i - 1]!.x, dense[i]!.y - dense[i - 1]!.y))
  const length = cum[cum.length - 1]!
  const pts = Array.from({ length: STEPS + 1 }, (_, s) => {
    const at = (length * s) / STEPS
    let k = 1
    while (k < cum.length - 1 && cum[k]! < at) k++
    const f = (at - cum[k - 1]!) / (cum[k]! - cum[k - 1]! || 1)
    return {
      x: dense[k - 1]!.x + (dense[k]!.x - dense[k - 1]!.x) * f,
      y: dense[k - 1]!.y + (dense[k]!.y - dense[k - 1]!.y) * f,
    }
  })
  return {
    length,
    x: pts.map((p) => p.x),
    y: pts.map((p) => p.y),
    deg: pts.map((_, i) => {
      const a = pts[Math.max(i - 1, 0)]!
      const b = pts[Math.min(i + 1, STEPS)]!
      return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
    }),
  }
})()

function along(values: number[], d: number): number {
  const f = Math.min(Math.max(d, 0), 1) * STEPS
  const i = Math.min(STEPS - 1, Math.floor(f))
  return values[i]! + (values[i + 1]! - values[i]!) * (f - i)
}

/** Piecewise-linear lookup, clamped at both ends. */
function interp(x: number, xs: number[], ys: number[]): number {
  if (x <= xs[0]!) return ys[0]!
  for (let i = 1; i < xs.length; i++) {
    if (x <= xs[i]!) return ys[i - 1]! + ((ys[i]! - ys[i - 1]!) * (x - xs[i - 1]!)) / (xs[i]! - xs[i - 1]!)
  }
  return ys[ys.length - 1]!
}

const driven = (p: number) => interp(p, [0, DRIVE_END, 1], [0, 1, 1])

// ---- vehicle sprites (facing +x, headlight beam ahead) ----------------------
type SpriteKind = 'car' | 'truck' | 'bike'
const spriteKind = (kind: VehicleKind): SpriteKind => (kind === 'bike' ? 'bike' : kind === 'car' || kind === 'ambulance' ? 'car' : 'truck')

const LINE = 0.9
const BRAND = 'var(--primary)'
const body = { fill: 'var(--loader-vehicle)', stroke: 'var(--loader-vehicle-line)', strokeWidth: LINE }
const cab = { fill: BRAND, stroke: 'var(--loader-vehicle-line)', strokeWidth: LINE }
const GLASS = 'var(--loader-glass)'
const HEADLIGHT = 'var(--loader-headlight)'
const TAILLIGHT = 'var(--loader-taillight)'
const SHADOW = 'var(--loader-vehicle-line)'

function Beam({ from, to }: { from: number; to: number }) {
  return <polygon points={`${from},-3 ${to},-17 ${to},17 ${from},3`} fill="url(#tl-beam)" />
}

function Sprite({ kind }: { kind: SpriteKind }) {
  if (kind === 'truck') {
    return (
      <>
        <Beam from={14} to={52} />
        <ellipse cx={-4} cy={1.6} rx={20} ry={8} fill={SHADOW} opacity={0.2} />
        <rect x={-23} y={-6.6} width={25} height={13.2} rx={1.6} {...body} />
        <rect x={3} y={-6} width={12} height={12} rx={3} {...cab} />
        <path d="M10 -4.6 L13 -3.6 L13 3.6 L10 4.6Z" fill={GLASS} />
        <rect x={13.6} y={-5} width={1.6} height={2.2} rx={0.8} fill={HEADLIGHT} />
        <rect x={13.6} y={2.8} width={1.6} height={2.2} rx={0.8} fill={HEADLIGHT} />
        <rect x={-23} y={-5.6} width={1.2} height={2} fill={TAILLIGHT} />
        <rect x={-23} y={3.6} width={1.2} height={2} fill={TAILLIGHT} />
      </>
    )
  }
  if (kind === 'bike') {
    return (
      <>
        <Beam from={10} to={40} />
        <ellipse cx={0} cy={1.4} rx={11} ry={4.6} fill={SHADOW} opacity={0.2} />
        <rect x={-10} y={-1.3} width={20} height={2.6} rx={1.3} fill={GLASS} />
        <rect x={3.5} y={-5.4} width={2} height={10.8} rx={1} fill={GLASS} />
        <ellipse cx={-1} cy={0} rx={4.4} ry={4} {...cab} />
        <circle cx={1} cy={0} r={2.5} {...body} />
        <rect x={9} y={-1.4} width={1.8} height={2.8} rx={0.9} fill={HEADLIGHT} />
      </>
    )
  }
  return (
    <>
      <Beam from={11} to={48} />
      <ellipse cx={0} cy={1.6} rx={14} ry={7.4} fill={SHADOW} opacity={0.2} />
      <rect x={-12} y={-6} width={24} height={12} rx={4.6} {...body} />
      <path d="M5 -4.7 L9 -3.6 L9 3.6 L5 4.7Z" fill={GLASS} />
      <path d="M-3 -4.7 L-7 -3.6 L-7 3.6 L-3 4.7Z" fill={GLASS} />
      <rect x={-3} y={-3.7} width={8} height={7.4} rx={1.4} {...body} />
      <rect x={3} y={-7.4} width={2.8} height={1.8} rx={0.9} {...body} />
      <rect x={3} y={5.6} width={2.8} height={1.8} rx={0.9} {...body} />
      <rect x={10.6} y={-4.8} width={1.8} height={2.2} rx={0.9} fill={HEADLIGHT} />
      <rect x={10.6} y={2.6} width={1.8} height={2.2} rx={0.9} fill={HEADLIGHT} />
      <rect x={-12} y={-4.8} width={1.3} height={2} fill={TAILLIGHT} />
      <rect x={-12} y={2.8} width={1.3} height={2} fill={TAILLIGHT} />
    </>
  )
}

// ---- animation ---------------------------------------------------------------
// The three step bars: [loop stops, fill amounts]; each fills over its own part of the loop, then resets.
const BARS: { stops: number[]; fills: number[] }[] = [
  { stops: [0, 0.3, 0.96, 1], fills: [0, 1, 1, 0] },
  { stops: [0, 0.3, 0.6, 0.96, 1], fills: [0, 0, 1, 1, 0] },
  { stops: [0, 0.6, 0.9, 0.96, 1], fills: [0, 0, 1, 1, 0] },
]
const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Drives the vehicle, trail, destination pin, halo and step bars from one frame loop, without re-rendering React. */
function useLoaderMotion() {
  const vehicle = useRef<SVGGElement>(null)
  const trail = useRef<SVGPathElement>(null)
  const pin = useRef<SVGCircleElement>(null)
  const halo = useRef<SVGCircleElement>(null)
  const bars = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const draw = (loop: number, ping: number) => {
      const d = driven(loop)
      const angle = (along(ROUTE.deg, d) * Math.PI) / 180
      vehicle.current?.setAttribute(
        'transform',
        `matrix(${Math.cos(angle)} ${Math.sin(angle)} ${-Math.sin(angle)} ${Math.cos(angle)} ${along(ROUTE.x, d)} ${along(ROUTE.y, d)})`,
      )
      vehicle.current?.setAttribute('opacity', String(interp(loop, [0, 0.04, 0.94, 1], [0, 1, 1, 0])))
      trail.current?.setAttribute('stroke-dashoffset', String(ROUTE.length * (1 - d)))
      trail.current?.setAttribute('opacity', String(interp(loop, [0, 0.9, 0.97, 1], [1, 1, 1, 0])))
      pin.current?.setAttribute('r', String(7 * interp(loop, [0, 0.8, 0.9, 0.96, 1], [0.6, 0.6, 1.35, 1, 1])))
      halo.current?.setAttribute('r', String(15 * interp(ping, [0, 1], [0.4, 1.5])))
      halo.current?.setAttribute('opacity', String(interp(ping, [0, 1], [0.5, 0])))
      BARS.forEach((b, i) => {
        const el = bars.current[i]
        if (el) el.style.transform = `scaleX(${interp(loop, b.stops, b.fills)})`
      })
    }
    if (reducedMotion()) {
      draw(DRIVE_END, 0)
      return
    }
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = now - start
      draw((t % LOOP_MS) / LOOP_MS, (t % PING_MS) / PING_MS)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  return { vehicle, trail, pin, halo, bars }
}

const LOGO = { width: 317, height: 273 }

/** Trigon mark: the two halves slide together once on mount. */
function Logo() {
  return (
    <svg width={40} height={(40 * LOGO.height) / LOGO.width} viewBox={`0 0 ${LOGO.width} ${LOGO.height}`} aria-hidden>
      <defs>
        <linearGradient id="tl-logo" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--loader-logo-from)' }} />
          <stop offset="1" style={{ stopColor: 'var(--loader-logo-to)' }} />
        </linearGradient>
      </defs>
      <path className="tl-upper" fill="url(#tl-logo)" d="M157 0 L250 160 Q172 122 89 118 Z" />
      <path className="tl-lower" fill="url(#tl-logo)" d="M89 123 L279 209 L317 272 L0 272 Z" />
    </svg>
  )
}

type Props = {
  /** Shapes the vehicle that drives the route. */
  vehicleKind?: VehicleKind
  title?: string
  /** Second line; after 15 s it becomes "Taking longer than usual". */
  subtitle?: string
  onCancel?: () => void
}

/** Full-area wait state: blurs what is behind it and shows the animated loader with a message and Cancel. */
export function TrigonLoader({ vehicleKind = 'car', title, subtitle, onCancel }: Props) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => clearTimeout(id)
  }, [])
  const m = useLoaderMotion()

  return (
    <div
      role="progressbar"
      aria-label={title ?? 'Loading'}
      className="absolute inset-0 z-30 flex items-center justify-center bg-app/75 p-4 backdrop-blur-[6px]"
    >
      <div className="flex w-full max-w-[324px] flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-[17px] font-semibold leading-7 tracking-[0.3em] text-ink">TRIGON</span>
        </div>

        <div className="w-full overflow-hidden rounded-2xl border border-line bg-[var(--loader-map)]" style={{ aspectRatio: `${MAP.width} / ${MAP.height}` }}>
          <svg width="100%" height="100%" viewBox={`0 0 ${MAP.width} ${MAP.height}`} aria-hidden>
            <defs>
              <linearGradient id="tl-beam" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" style={{ stopColor: 'var(--loader-beam)', stopOpacity: 0.55 }} />
                <stop offset="1" style={{ stopColor: 'var(--loader-beam)', stopOpacity: 0 }} />
              </linearGradient>
            </defs>
            {[20, 60, 100, 140, 180, 220, 260, 300].map((x) => (
              <line key={`v${x}`} x1={x} x2={x} y1={0} y2={MAP.height} stroke="var(--loader-grid)" />
            ))}
            {[20, 60, 100, 140, 180].map((y) => (
              <line key={`h${y}`} y1={y} y2={y} x1={0} x2={MAP.width} stroke="var(--loader-grid)" />
            ))}
            <path d="M0 120 L320 96" stroke="var(--loader-road)" strokeWidth={9} strokeLinecap="round" />
            <path d="M170 0 L186 200" stroke="var(--loader-road)" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
            <path d="M64 0 L86 200" stroke="var(--loader-road)" strokeWidth={6} strokeLinecap="round" opacity={0.8} />
            <path d={ROUTE_D} fill="none" stroke={BRAND} strokeOpacity={0.25} strokeWidth={3.5} strokeDasharray="2 7" strokeLinecap="round" />
            <path
              ref={m.trail}
              d={ROUTE_D}
              fill="none"
              stroke={BRAND}
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeDasharray={`${ROUTE.length} ${ROUTE.length}`}
              strokeDashoffset={ROUTE.length}
            />
            <circle cx={START.x} cy={START.y} r={6} fill="var(--surface)" stroke={BRAND} strokeWidth={3} />
            <circle ref={m.halo} cx={DEST.x} cy={DEST.y} r={6} fill={BRAND} opacity={0} />
            <circle ref={m.pin} cx={DEST.x} cy={DEST.y} r={4} fill={BRAND} stroke="var(--surface)" strokeWidth={2.5} />
            <g ref={m.vehicle} opacity={0}>
              <g transform="scale(1.25)">
                <Sprite kind={spriteKind(vehicleKind)} />
              </g>
            </g>
          </svg>
        </div>

        {title && (
          <div className="text-center">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {(subtitle || slow) && <p className="mt-1 text-[12px] text-ink-3">{slow ? 'Taking longer than usual' : subtitle}</p>}
          </div>
        )}

        <div className="flex items-center gap-2" aria-hidden>
          {BARS.map((_, i) => (
            <div key={i} className="h-1 w-[20px] overflow-hidden rounded-full bg-line">
              <div
                ref={(el) => {
                  m.bars.current[i] = el
                }}
                className="h-full w-full origin-left bg-primary"
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-lg border border-line bg-surface px-8 text-[12px] font-medium text-ink hover:bg-surface-muted"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
