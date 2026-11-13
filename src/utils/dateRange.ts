export const DAY_MS = 86_400_000
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

/** Calendar days touched by the period, both ends counted (14 Oct to 20 Oct = 7). */
export function dayCount(from: number, to: number): number {
  return Math.round((startOfDay(to) - startOfDay(from)) / DAY_MS) + 1
}

/** "20 Oct" */
export const dayMonth = (ms: number) => `${new Date(ms).getDate()} ${MONTHS[new Date(ms).getMonth()]}`

/** "20 Oct 2026" */
export function formatDate(ms: number): string {
  return `${dayMonth(ms)} ${new Date(ms).getFullYear()}`
}
