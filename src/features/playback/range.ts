import type { PlaybackRange, RangePreset } from './types'

export const MAX_DAYS = 7
const DAY_MS = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Local midnight of the day containing `ms`. */
export function startOfDay(ms: number): number {
  const d = new Date(ms)
  d.setHours(0, 0, 0, 0)
  return d.getTime()
}

/** Midnight `days` calendar days after `ms` (negative = before). Safe across daylight-saving changes. */
export function addDays(ms: number, days: number): number {
  const d = new Date(ms)
  d.setDate(d.getDate() + days)
  return d.getTime()
}

export function presetRange(preset: Exclude<RangePreset, 'custom'>, now = Date.now()): PlaybackRange {
  const today = startOfDay(now)
  if (preset === 'today') return { preset, from: today, to: now }
  if (preset === 'yesterday') return { preset, from: addDays(today, -1), to: today - 1 }
  return { preset, from: addDays(today, -(MAX_DAYS - 1)), to: now }
}

/** Calendar days touched by the period, both ends counted (14 Oct to 20 Oct = 7). */
export function dayCount(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS) + 1
}

export type RangeProblem = 'order' | 'future' | 'tooLong'

/** Why a period cannot be played back, or null when it is fine. Order is checked first, then the 7-day limit. */
export function rangeProblem(from: number, to: number, now = Date.now()): RangeProblem | null {
  if (to <= from) return 'order'
  if (dayCount(from, to) > MAX_DAYS) return 'tooLong'
  if (to > now) return 'future'
  return null
}

const dayMonth = (ms: number) => `${new Date(ms).getDate()} ${MONTHS[new Date(ms).getMonth()]}`
const year = (ms: number) => new Date(ms).getFullYear()
const sameDay = (a: number, b: number) => startOfDay(a) === startOfDay(b)

/** "1:15 PM" */
export function formatClockMs(ms: number): string {
  const d = new Date(ms)
  const h = d.getHours()
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** "11:25:08 AM" */
export function formatClockSecondsMs(ms: number): string {
  const d = new Date(ms)
  const h = d.getHours()
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** "20 Oct 2026" */
export function formatDate(ms: number): string {
  return `${dayMonth(ms)} ${year(ms)}`
}

/** "20 Oct 2026, 11:25:08 AM" */
export function formatDateTimeSeconds(ms: number): string {
  return `${formatDate(ms)}, ${formatClockSecondsMs(ms)}`
}

/** Header chip: "Today · 20 Oct 2026", "14 – 20 Oct 2026", "28 Oct – 3 Nov 2026". */
export function formatRangeChip(range: PlaybackRange): string {
  const { preset, from, to } = range
  if (preset === 'today') return `Today · ${formatDate(from)}`
  if (preset === 'yesterday') return `Yesterday · ${formatDate(from)}`
  if (sameDay(from, to)) return formatDate(from)
  if (year(from) !== year(to)) return `${formatDate(from)} – ${formatDate(to)}`
  if (new Date(from).getMonth() !== new Date(to).getMonth()) return `${dayMonth(from)} – ${dayMonth(to)} ${year(to)}`
  return `${new Date(from).getDate()} – ${dayMonth(to)} ${year(to)}`
}

/** Panel range card: "20 Oct, 12:00 AM – 1:15 PM" (one day) or "14 Oct 12:00 AM – 20 Oct 1:15 PM". */
export function formatRangeCard(from: number, to: number): string {
  if (sameDay(from, to)) return `${dayMonth(from)}, ${formatClockMs(from)} – ${formatClockMs(to)}`
  return `${dayMonth(from)} ${formatClockMs(from)} – ${dayMonth(to)} ${formatClockMs(to)}`
}

/** Loading text: "Today, 12:00 AM to now". */
export function describeRange(range: PlaybackRange, now = Date.now()): string {
  const { preset, from, to } = range
  if (preset === 'today') return `Today, ${formatClockMs(from)} to now`
  if (preset === 'yesterday') return `Yesterday, ${formatClockMs(from)} to ${formatClockMs(to)}`
  const end = Math.abs(to - now) < 60_000 ? 'now' : `${dayMonth(to)} ${formatClockMs(to)}`
  return `${dayMonth(from)} ${formatClockMs(from)} to ${end}`
}

/** "3h 12m", "48m" */
export function formatHm(ms: number): string {
  const total = Math.round(ms / 60_000)
  const h = Math.floor(total / 60)
  const m = total % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

/** "25 min", "1h 05m" */
export function formatDuration(ms: number): string {
  const total = Math.max(1, Math.round(ms / 60_000))
  return total < 60 ? `${total} min` : formatHm(total * 60_000)
}

/** "84.6 km" */
export function formatDistance(km: number): string {
  return `${km.toFixed(1)} km`
}

/** Slider end label: the time for a one-day period, otherwise date and time. */
export function formatEdge(ms: number, multiDay: boolean): string {
  return multiDay ? `${dayMonth(ms)}, ${formatClockMs(ms)}` : formatClockMs(ms)
}
