import { describe, expect, it } from 'vitest'
import { formatAgo, formatPercent, pageItems } from './format'

describe('formatAgo', () => {
  const now = new Date('2026-10-20T13:17:00').getTime()
  const ago = (min: number) => new Date(now - min * 60_000).toISOString()
  it('formats minutes, hours and days', () => {
    expect(formatAgo(ago(0), now)).toBe('just now')
    expect(formatAgo(ago(2), now)).toBe('2 min ago')
    expect(formatAgo(ago(180), now)).toBe('3 hr ago')
    expect(formatAgo(ago(3 * 24 * 60), now)).toBe('3 days ago')
    expect(formatAgo(ago(24 * 60), now)).toBe('1 day ago')
  })
})

describe('formatPercent', () => {
  it('rounds and handles an empty fleet', () => {
    expect(formatPercent(104, 128)).toBe('81%')
    expect(formatPercent(14, 128)).toBe('11%')
    expect(formatPercent(0, 0)).toBe('0%')
  })
})

describe('pageItems', () => {
  it('lists every page when there are few', () => {
    expect(pageItems(2, 4)).toEqual([1, 2, 3, 4])
  })
  it('adds gaps around the current page', () => {
    expect(pageItems(1, 16)).toEqual([1, 2, 3, 'gap', 16])
    expect(pageItems(8, 16)).toEqual([1, 2, 3, 'gap', 7, 8, 9, 'gap', 16])
    expect(pageItems(16, 16)).toEqual([1, 2, 3, 'gap', 15, 16])
  })
})
