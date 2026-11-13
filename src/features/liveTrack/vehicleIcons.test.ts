import { describe, expect, it } from 'vitest'
import { vehicleKindOf } from './vehicleIcons'

describe('vehicleKindOf', () => {
  it('maps the free-text type like the mobile app', () => {
    expect(vehicleKindOf('Pickup')).toBe('car')
    expect(vehicleKindOf('Bus')).toBe('bus')
    expect(vehicleKindOf('Container')).toBe('longTruck')
    expect(vehicleKindOf('Concrete mixer')).toBe('mixer')
    expect(vehicleKindOf('Tanker')).toBe('truck')
    expect(vehicleKindOf('Ambulance')).toBe('ambulance')
  })
})
