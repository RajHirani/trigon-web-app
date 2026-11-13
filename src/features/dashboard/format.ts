const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function time(d: Date): string {
  const h = d.getHours()
  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

/** "2 min ago", "3 hr ago", "3 days ago". */
export function formatAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

/** "20 Oct 2026, 1:15:27 PM" (seconds precision, as in Figma). */
export function formatFullDateTimeSeconds(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${h % 12 || 12}:${mm}:${ss} ${h < 12 ? 'AM' : 'PM'}`
}

/** "20 Oct 2026, 1:15 PM" */
export function formatFullDateTime(iso: string): string {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${time(d)}`
}

/** Share of the fleet, e.g. 104 of 128 -> "81%". 0 when the fleet is empty. */
export function formatPercent(part: number, whole: number): string {
  return `${whole === 0 ? 0 : Math.round((part / whole) * 100)}%`
}

/** Page numbers for the pager with "…" gaps: 1 2 3 … 16. */
export function pageItems(page: number, pageCount: number): (number | 'gap')[] {
  if (pageCount <= 5) return Array.from({ length: pageCount }, (_, i) => i + 1)
  const wanted = new Set([1, 2, 3, pageCount, page - 1, page, page + 1])
  if (page <= 3) wanted.add(3)
  const pages = [...wanted].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const out: (number | 'gap')[] = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1]! > 1) out.push('gap')
    out.push(p)
  })
  return out
}
