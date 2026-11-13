import { describe, expect, it } from 'vitest'
import { compassPoint, formatAgoSeconds, formatCoords, formatHeading } from './geo'

describe('geo helpers', () => {
  it('names the compass point', () => {
    expect(compassPoint(0)).toBe('North')
    expect(compassPoint(142)).toBe('South-east')
    expect(compassPoint(359)).toBe('North')
    expect(compassPoint(-90)).toBe('West')
  })

  it('formats heading and coordinates like Figma', () => {
    expect(formatHeading(142)).toBe('Heading 142° · South-east')
    expect(formatCoords(22.98183, 72.594971)).toBe('22.981830, 72.594971')
  })

  it('formats the time since the last fix', () => {
    const now = Date.parse('2026-10-20T10:00:00Z')
    expect(formatAgoSeconds('2026-10-20T09:59:55Z', now)).toBe('5 sec ago')
    expect(formatAgoSeconds('2026-10-20T09:58:00Z', now)).toBe('2 min ago')
    expect(formatAgoSeconds('2026-10-20T10:00:05Z', now)).toBe('0 sec ago')
  })
})
