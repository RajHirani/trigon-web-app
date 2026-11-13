import ambulance from '@/assets/vehicle-icons/ambulance.svg?raw'
import bike from '@/assets/vehicle-icons/bike.svg?raw'
import bus from '@/assets/vehicle-icons/bus.svg?raw'
import car from '@/assets/vehicle-icons/car.svg?raw'
import longTruck from '@/assets/vehicle-icons/long-truck.svg?raw'
import mixer from '@/assets/vehicle-icons/mixer.svg?raw'
import truck from '@/assets/vehicle-icons/truck.svg?raw'

export type VehicleKind = 'car' | 'bike' | 'bus' | 'truck' | 'longTruck' | 'mixer' | 'ambulance'

// Same top-down drawings as the mobile app (trigon-mobile-app/assets/vehicle-icons), head pointing up.
// The body is `currentColor`, so the status colour tints it. Sizes are each SVG's own viewBox.
export const VEHICLE_ICONS: Record<VehicleKind, { svg: string; width: number; height: number }> = {
  car: { svg: car, width: 40, height: 88 },
  bus: { svg: bus, width: 44, height: 120 },
  bike: { svg: bike, width: 36, height: 88 },
  truck: { svg: truck, width: 44, height: 104 },
  longTruck: { svg: longTruck, width: 44, height: 148 },
  mixer: { svg: mixer, width: 44, height: 108 },
  ambulance: { svg: ambulance, width: 44, height: 92 },
}

/** Map size relative to the SVG's own size (mobile uses 0.55). */
export const VEHICLE_ICON_SCALE = 0.6

// TODO(data): the API's vehicle-type values are unknown. Same placeholder mapping as the mobile app:
// from the free-text type; anything unrecognised draws as a truck.
export function vehicleKindOf(vehicleType: string): VehicleKind {
  const type = vehicleType.toLowerCase()
  if (/ambulance/.test(type)) return 'ambulance'
  if (/bike|motor|scooter/.test(type)) return 'bike'
  if (/bus|coach/.test(type)) return 'bus'
  if (/car|pickup|van|suv|jeep/.test(type)) return 'car'
  if (/mixer|mixture|concrete/.test(type)) return 'mixer'
  if (/long|trailer|container/.test(type)) return 'longTruck'
  return 'truck'
}
