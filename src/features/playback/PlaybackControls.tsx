import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useRef } from 'react'
import { sampleAt } from './analyze'
import { FLOAT } from './PlaybackOverlays'
import { formatDateTimeSeconds, formatDistance, formatEdge, startOfDay } from './range'
import type { PlaybackPoint, TripAnalysis } from './types'
import { SPEEDS, type PlayerSpeed } from './usePlayback'

const CAPTION = 'text-[10px] font-medium uppercase tracking-wide text-ink-3'

type SliderProps = {
  count: number
  pos: number
  analysis: TripAnalysis
  valueText: string
  onSeek: (pos: number) => void
}

/** Progress bar with a tick at every stop (dark) and over-speed spell (red). Drag, click or use the arrow keys. */
function Timeline({ count, pos, analysis, valueText, onSeek }: SliderProps) {
  const ref = useRef<HTMLDivElement>(null)
  const last = Math.max(1, count - 1)
  const pct = (i: number) => `${(i / last) * 100}%`
  const seekFromPointer = (clientX: number) => {
    const r = ref.current?.getBoundingClientRect()
    if (!r || r.width === 0) return
    onSeek(Math.min(1, Math.max(0, (clientX - r.left) / r.width)) * last)
  }
  const step = Math.max(1, Math.round(last / 100))

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="Playback position"
      aria-valuemin={0}
      aria-valuemax={last}
      aria-valuenow={Math.round(pos)}
      aria-valuetext={valueText}
      className="relative h-6 cursor-pointer touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        seekFromPointer(e.clientX)
      }}
      onPointerMove={(e) => e.buttons === 1 && seekFromPointer(e.clientX)}
      onKeyDown={(e) => {
        const to: Record<string, number> = {
          ArrowRight: pos + step,
          ArrowUp: pos + step,
          ArrowLeft: pos - step,
          ArrowDown: pos - step,
          PageUp: pos + step * 10,
          PageDown: pos - step * 10,
          Home: 0,
          End: last,
        }
        if (e.key in to) {
          e.preventDefault()
          onSeek(to[e.key]!)
        }
      }}
    >
      <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary/15" />
      <div className="absolute left-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-primary" style={{ width: pct(pos) }} />
      {analysis.stops.map((s) => (
        <span
          key={`s${s.n}`}
          aria-hidden
          className={`pointer-events-none absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${pos >= s.idx ? 'bg-ink' : 'bg-offline'}`}
          style={{ left: pct(s.idx) }}
        />
      ))}
      {analysis.overSpeed.map((e) => (
        <span
          key={`o${e.n}`}
          aria-hidden
          className={`pointer-events-none absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stopped ${pos >= e.peakIdx ? '' : 'opacity-50'}`}
          style={{ left: pct(e.peakIdx) }}
        />
      ))}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-primary bg-surface shadow"
        style={{ left: pct(pos) }}
      />
    </div>
  )
}

type Props = {
  points: PlaybackPoint[]
  analysis: TripAnalysis
  pos: number
  playing: boolean
  speed: PlayerSpeed
  onToggle: () => void
  onSpeed: (s: PlayerSpeed) => void
  onSeek: (pos: number) => void
}

/** Bottom bar: play / pause, time, distance, speed, 1x-8x, and the timeline. Figma "Playback Controls". */
export function PlaybackControls({ points, analysis, pos, playing, speed, onToggle, onSpeed, onSeek }: Props) {
  const cur = sampleAt(points, pos)
  const first = points[0]!
  const lastPoint = points[points.length - 1]!
  const multiDay = startOfDay(first.t) !== startOfDay(lastPoint.t)
  const time = formatDateTimeSeconds(cur.t)

  return (
    <div className={`${FLOAT} flex flex-col gap-2 p-4 sm:px-6 sm:pb-3`}>
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <button
          onClick={onToggle}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-primary text-lg text-on-primary hover:bg-primary-hover"
        >
          <FontAwesomeIcon icon={playing ? faPause : faPlay} className={playing ? '' : 'ml-0.5'} />
        </button>
        <div className="grid flex-1 grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)_minmax(0,1fr)] gap-x-6 gap-y-1 sm:min-w-[420px]">
          <div className="min-w-0">
            <div className={CAPTION}>Time</div>
            <div className="mt-0.5 truncate text-sm font-medium text-ink">{time}</div>
          </div>
          <div className="min-w-0">
            <div className={CAPTION}>Distance</div>
            <div className="mt-0.5 truncate text-sm font-medium text-ink">{formatDistance(cur.km)}</div>
          </div>
          <div className="min-w-0">
            <div className={CAPTION}>Speed</div>
            <div className="mt-0.5 truncate text-sm font-medium text-moving-fg">{Math.round(cur.speed)} km/h</div>
          </div>
        </div>
        <button
          onClick={() => onSpeed(SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length]!)}
          aria-label={`Playback speed ${speed}x. Press to change`}
          title="Change playback speed"
          className="flex h-11 w-16 shrink-0 items-center justify-center rounded-xl bg-primary-subtle text-sm font-semibold text-primary hover:bg-line"
        >
          {speed}x
        </button>
      </div>

      <div>
        <Timeline count={points.length} pos={pos} analysis={analysis} valueText={time} onSeek={onSeek} />
        <div className="flex justify-between text-[11px] leading-4 text-ink-3">
          <span>{formatEdge(first.t, multiDay)}</span>
          <span>{formatEdge(lastPoint.t, multiDay)}</span>
        </div>
      </div>
    </div>
  )
}
