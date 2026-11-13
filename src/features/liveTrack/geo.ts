const POINTS = ['North', 'North-east', 'East', 'South-east', 'South', 'South-west', 'West', 'North-west'] as const

/** 142 -> "South-east" (eight compass points). */
export function compassPoint(deg: number): string {
  const d = ((deg % 360) + 360) % 360
  return POINTS[Math.round(d / 45) % 8]!
}

/** "Heading 142° · South-east" */
export function formatHeading(deg: number): string {
  return `Heading ${Math.round(((deg % 360) + 360) % 360)}° · ${compassPoint(deg)}`
}

/** "22.981830, 72.594971" (6 decimals, as in Figma). */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`
}

/** Whole seconds since `iso` (never negative). */
export function secondsSince(iso: string, now = Date.now()): number {
  return Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
}

/** "5 sec ago", "2 min ago", "3 hr ago", "3 days ago" (seconds precision for the first minute). */
export function formatAgoSeconds(iso: string, now = Date.now()): string {
  const s = secondsSince(iso, now)
  if (s < 60) return `${s} sec ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} hr ago`
  const d = Math.floor(h / 24)
  return `${d} ${d === 1 ? 'day' : 'days'} ago`
}

/** "6:12 AM" */
export function formatClock(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** "Expires today at 7:15 PM · 6 hours left" (date shown when it is not today). */
export function formatExpiry(expiresAt: string, now = Date.now()): string {
  const end = new Date(expiresAt)
  const left = Math.max(0, end.getTime() - now)
  const minutes = Math.round(left / 60_000)
  const hours = Math.round(left / 3_600_000)
  const remaining =
    minutes < 60 ? `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left` : `${hours} ${hours === 1 ? 'hour' : 'hours'} left`
  const sameDay = end.toDateString() === new Date(now).toDateString()
  const day = sameDay
    ? 'today'
    : new Date(now + 86_400_000).toDateString() === end.toDateString()
      ? 'tomorrow'
      : end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  return `Expires ${day} at ${formatClock(expiresAt)} · ${remaining}`
}
