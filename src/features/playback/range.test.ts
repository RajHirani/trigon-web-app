import { describe, expect, it } from 'vitest'
import {
  dayCount,
  describeRange,
  formatDuration,
  formatHm,
  formatRangeCard,
  formatRangeChip,
  presetRange,
  rangeProblem,
} from './range'

const at = (m: number, d: number, h = 0, min = 0) => new Date(2026, m, d, h, min, 0, 0).getTime()
const NOW = at(9, 20, 13, 15) // 20 Oct 2026, 1:15 PM

describe('presetRange', () => {
  it('today runs from midnight to now', () => {
    expect(presetRange('today', NOW)).toEqual({ preset: 'today', from: at(9, 20), to: NOW })
  })
  it('yesterday is the whole of the previous day', () => {
    const r = presetRange('yesterday', NOW)
    expect(r.from).toBe(at(9, 19))
    expect(r.to).toBe(at(9, 20) - 1)
  })
  it('last 7 days is seven calendar days including today', () => {
    const r = presetRange('week', NOW)
    expect(r.from).toBe(at(9, 14))
    expect(dayCount(r.from, r.to)).toBe(7)
  })
})

describe('rangeProblem', () => {
  it('accepts up to 7 calendar days', () => {
    expect(rangeProblem(at(9, 14), NOW, NOW)).toBeNull()
  })
  it('rejects 8 or more days, even when the hours add up to less', () => {
    expect(rangeProblem(at(9, 13, 23, 0), NOW, NOW)).toBe('tooLong')
    expect(rangeProblem(at(9, 8), NOW, NOW)).toBe('tooLong')
  })
  it('rejects an end in the future and an end before the start', () => {
    expect(rangeProblem(at(9, 20), NOW + 60_000, NOW)).toBe('future')
    expect(rangeProblem(at(9, 20, 10), at(9, 20, 9), NOW)).toBe('order')
  })
})

describe('labels', () => {
  it('formats the header chip', () => {
    expect(formatRangeChip(presetRange('today', NOW))).toBe('Today · 20 Oct 2026')
    expect(formatRangeChip(presetRange('yesterday', NOW))).toBe('Yesterday · 19 Oct 2026')
    expect(formatRangeChip({ preset: 'custom', from: at(9, 14), to: NOW })).toBe('14 – 20 Oct 2026')
    expect(formatRangeChip({ preset: 'custom', from: at(9, 28), to: at(10, 3, 9) })).toBe('28 Oct – 3 Nov 2026')
    expect(formatRangeChip({ preset: 'custom', from: at(9, 20), to: NOW })).toBe('20 Oct 2026')
  })
  it('formats the panel card', () => {
    expect(formatRangeCard(at(9, 20), NOW)).toBe('20 Oct, 12:00 AM – 1:15 PM')
    expect(formatRangeCard(at(9, 14), NOW)).toBe('14 Oct 12:00 AM – 20 Oct 1:15 PM')
  })
  it('describes the loading period', () => {
    expect(describeRange(presetRange('today', NOW), NOW)).toBe('Today, 12:00 AM to now')
    expect(describeRange(presetRange('yesterday', NOW), NOW)).toBe('Yesterday, 12:00 AM to 11:59 PM')
  })
  it('formats durations', () => {
    expect(formatHm(192 * 60_000)).toBe('3h 12m')
    expect(formatHm(48 * 60_000)).toBe('48m')
    expect(formatDuration(25 * 60_000)).toBe('25 min')
    expect(formatDuration(65 * 60_000)).toBe('1h 05m')
    expect(formatDuration(1000)).toBe('1 min')
  })
})
