import { faAnglesLeft, faAnglesRight, faClock } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { FLOAT } from './PlaybackOverlays'
import { formatDistance, formatHm, formatRangeCard, MAX_DAYS } from './range'
import {
  HOLD_OPTIONS,
  OVER_SPEED_OPTIONS,
  type PlaybackRange,
  type RangeDraft,
  type RangePreset,
  type TripAnalysis,
  type TripSettings,
} from './types'

const CAPTION = 'text-[10px] font-medium uppercase tracking-wide text-ink-3'
const CHIPS: { value: RangePreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'Last 7 days' },
  { value: 'custom', label: 'Custom' },
]

/** A bordered card that is really a native select: label on top, current value below. */
function SettingSelect({ label, value, options, unit, onChange }: { label: string; value: number; options: readonly number[]; unit: string; onChange: (v: number) => void }) {
  return (
    <label className="relative block h-12 cursor-pointer rounded-lg border border-line px-3 py-1.5 focus-within:border-primary hover:bg-surface-muted">
      <span className="block text-[10px] leading-4 text-ink-3">{label}</span>
      <span className="block text-[12px] font-medium leading-5 text-ink">
        {value} {unit}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o} {unit}
          </option>
        ))}
      </select>
    </label>
  )
}

function Tile({ label, value, tone = 'text-ink' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-surface-muted px-3 py-2">
      <div className="truncate text-[10px] leading-4 text-ink-3">{label}</div>
      <div className={`truncate text-[15px] font-semibold leading-6 ${tone}`}>{value}</div>
    </div>
  )
}

type Props = {
  range: PlaybackRange
  draft: RangeDraft | null
  pickerOpen: boolean
  settings: TripSettings
  /** null while there is no route (loading, no movement, error): the summary is left out. */
  analysis: TripAnalysis | null
  collapsed: boolean
  onToggle: () => void
  onPreset: (p: Exclude<RangePreset, 'custom'>) => void
  onOpenPicker: () => void
  onSettings: (s: TripSettings) => void
}

/** Left panel. Figma "Playback Panel" and "Playback Panel / Collapsed". */
export function PlaybackPanel({ range, draft, pickerOpen, settings, analysis, collapsed, onToggle, onPreset, onOpenPicker, onSettings }: Props) {
  const shown = draft ?? range
  const card = formatRangeCard(shown.from, shown.to)

  if (collapsed && analysis) {
    const chip = 'inline-flex h-[23px] items-center whitespace-nowrap rounded-full px-2.5 text-xs font-medium'
    return (
      <div className={`${FLOAT} flex w-full max-w-[392px] items-start gap-3 px-3.5 py-4 lg:w-[392px]`}>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[12px] font-medium text-ink">
            <FontAwesomeIcon icon={faClock} className="text-primary" />
            <span className="truncate">{card}</span>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-x-1.5 gap-y-1.5">
            <span className={`${chip} bg-violet-bg text-violet`}>{formatDistance(analysis.distanceKm)}</span>
            <span className={`${chip} bg-offline-bg text-ink-2`}>Max {Math.round(analysis.maxSpeed)} km/h</span>
            <span className={`${chip} bg-offline-bg text-ink-2`}>
              {analysis.stops.length} {analysis.stops.length === 1 ? 'stop' : 'stops'}
            </span>
            <span className={`${chip} ${analysis.overSpeed.length ? 'bg-stopped-bg text-stopped-fg' : 'bg-moving-bg text-moving-fg'}`}>
              {analysis.overSpeed.length ? `${analysis.overSpeed.length} over-speed` : 'No over-speed'}
            </span>
          </div>
        </div>
        <button
          onClick={onToggle}
          aria-label="Expand playback details"
          title="Expand panel"
          className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg bg-surface-muted text-control hover:bg-line"
        >
          <FontAwesomeIcon icon={faAnglesRight} className="text-xs" />
        </button>
      </div>
    )
  }

  const activeChip: RangePreset = pickerOpen ? 'custom' : range.preset
  const tooLong = !!draft?.tooLong
  return (
    <div className={`${FLOAT} flex max-h-full w-full max-w-[356px] flex-col gap-5 overflow-y-auto overflow-x-hidden p-6`}>
      <div className="flex h-8 shrink-0 items-center justify-between">
        <h2 className="text-[15px] font-semibold text-ink">Playback</h2>
        <button
          onClick={onToggle}
          disabled={!analysis}
          aria-label="Collapse playback details"
          title="Collapse panel"
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-muted text-control hover:bg-line disabled:opacity-40"
        >
          <FontAwesomeIcon icon={faAnglesLeft} className="text-xs" />
        </button>
      </div>

      <div className="-mt-1 flex flex-col gap-3">
        <div role="group" aria-label="Period" className="flex flex-wrap gap-2">
          {CHIPS.map((c) => (
            <button
              key={c.value}
              data-range-trigger={c.value === 'custom' ? '' : undefined}
              aria-pressed={activeChip === c.value}
              onClick={() => (c.value === 'custom' ? onOpenPicker() : onPreset(c.value))}
              className={`h-9 grow rounded-lg px-3 text-xs ${
                activeChip === c.value ? 'bg-primary-subtle font-medium text-primary' : 'bg-surface-muted text-ink-2 hover:bg-line'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <button
          data-range-trigger=""
          onClick={onOpenPicker}
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
          className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border-2 bg-surface-muted px-4 text-left ${
            tooLong ? 'border-stopped' : pickerOpen ? 'border-primary' : 'border-transparent'
          }`}
        >
          <span className="flex min-w-0 items-center gap-3 text-[12px] font-medium text-ink">
            <FontAwesomeIcon icon={faClock} className="shrink-0 text-primary" />
            <span className="truncate">{card}</span>
          </span>
          <span className={`shrink-0 text-[10px] ${tooLong ? 'text-stopped-fg' : 'text-ink-3'}`}>Max {MAX_DAYS} days</span>
        </button>
      </div>

      <div>
        <h3 className={CAPTION}>Trip settings</h3>
        <div className="mt-2.5 grid grid-cols-2 gap-3">
          <SettingSelect
            label="Over speed"
            unit="km/h"
            value={settings.overSpeedKmh}
            options={OVER_SPEED_OPTIONS}
            onChange={(overSpeedKmh) => onSettings({ ...settings, overSpeedKmh })}
          />
          <SettingSelect
            label="Hold (stop time)"
            unit="min"
            value={settings.holdMin}
            options={HOLD_OPTIONS}
            onChange={(holdMin) => onSettings({ ...settings, holdMin })}
          />
        </div>
      </div>

      {analysis && (
        <div>
          <h3 className={CAPTION}>Trip summary</h3>
          <div className="mt-2.5 grid grid-cols-2 gap-3">
            <Tile label="Distance" value={formatDistance(analysis.distanceKm)} tone="text-violet" />
            <Tile label="Max speed" value={`${Math.round(analysis.maxSpeed)} km/h`} />
            <Tile label="Moving time" value={formatHm(analysis.movingMs)} tone="text-moving-fg" />
            <Tile label="Stopped time" value={formatHm(analysis.stoppedMs)} tone="text-idle-fg" />
            <Tile label={`Stops (${settings.holdMin} min or more)`} value={String(analysis.stops.length)} />
            <Tile
              label="Over-speed"
              value={`${analysis.overSpeed.length} ${analysis.overSpeed.length === 1 ? 'event' : 'events'}`}
              tone={analysis.overSpeed.length ? 'text-stopped-fg' : 'text-ink'}
            />
          </div>
          <p className="mt-3 text-[10px] text-ink-3">Tap a stop or over-speed marker on the map for details.</p>
        </div>
      )}
    </div>
  )
}
