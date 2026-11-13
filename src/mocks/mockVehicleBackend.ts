import type {
  Vehicle,
  VehicleAlert,
  VehicleKpis,
  VehiclePage,
  VehicleQuery,
  VehicleStatus,
  VehicleSummary,
} from '@/features/dashboard/types'

// Deterministic fake fleet (128 vehicles: 104 active, 14 expiring, 10 expired),
// ported from the mobile mock. Used while VITE_USE_MOCK=true.
const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const PAGE_SIZE = 9
export const DEVICE_TYPES = ['EV02', 'ASI140', 'VT05', 'AIS140'] as const

const TYPES = ['Truck', 'Tanker', 'Container', 'Pickup', 'Bus']
const OWNERS = ['Shree Logistics', 'Kutch Carriers', 'Narmada Freight', 'Saurashtra Movers']
const STATUSES: VehicleStatus[] = ['moving', 'idle', 'stopped', 'offline', 'moving']
const MINUTE = 60_000

function build(index: number): Vehicle {
  const status = STATUSES[index % STATUSES.length]!
  const offline = status === 'offline'
  const stopKind = index % 15
  const alerts: VehicleAlert[] = offline
    ? ['networkError', 'batteryDisconnected']
    : status === 'stopped' && stopKind === 12
      ? ['batteryDisconnected']
      : status === 'stopped' && stopKind === 2
        ? ['locationError']
        : []
  const minutesAgo = offline ? 3 * 24 * 60 + index : 2 + ((index * 7) % 40)
  return {
    id: `v${index}`,
    plate: `GJ${String(3 + (index % 30)).padStart(2, '0')}${String.fromCharCode(65 + (index % 26))}${String.fromCharCode(
      65 + ((index * 7) % 26),
    )}${String(1000 + ((index * 937) % 9000))}`,
    vehicleType: TYPES[index % TYPES.length]!,
    owner: OWNERS[index % OWNERS.length]!,
    deviceType: DEVICE_TYPES[index % DEVICE_TYPES.length]!,
    status,
    speed: offline ? null : status === 'moving' ? 20 + ((index * 13) % 80) : 0,
    ignition: offline ? null : status !== 'stopped',
    ac: offline ? null : index % 3 === 0,
    fuelPercent: offline ? null : 30 + ((index * 11) % 70),
    alerts,
    lastUpdate: new Date(Date.now() - minutesAgo * MINUTE).toISOString(),
    planState: index < 104 ? 'active' : index < 118 ? 'expiring' : 'expired',
  }
}

/** Device lock state set from the UI (mock only). */
const lockState = new Map<string, boolean>()

const FLEET: Vehicle[] = Array.from({ length: 128 }, (_, i) => build(i))

/** Dev switch: `?fleet=empty` in the URL simulates an account with no vehicles. */
const emptyFleet = () => typeof location !== 'undefined' && new URLSearchParams(location.search).get('fleet') === 'empty'
const fleet = () => (emptyFleet() ? [] : FLEET)

export const mockVehicleBackend = {
  async getKpis(): Promise<VehicleKpis> {
    await delay(500)
    const f = fleet()
    const count = (plan: Vehicle['planState']) => f.filter((v) => v.planState === plan).length
    return { total: f.length, active: count('active'), expiring: count('expiring'), expired: count('expired') }
  },

  async list(query: VehicleQuery): Promise<VehiclePage> {
    await delay(700)
    const needle = query.search.trim().toLowerCase()
    const matches = fleet().filter(
      (v) =>
        (query.plan === 'total' || v.planState === query.plan) &&
        (query.deviceType === null || v.deviceType === query.deviceType) &&
        (needle === '' || v.plate.toLowerCase().includes(needle)),
    )
    const start = (query.page - 1) * PAGE_SIZE
    return { items: matches.slice(start, start + PAGE_SIZE), total: matches.length, pageSize: PAGE_SIZE }
  },

  async deviceTypes(): Promise<string[]> {
    return [...DEVICE_TYPES]
  },
  async get(id: string): Promise<Vehicle | null> {
    await delay(300)
    return fleet().find((v) => v.id === id) ?? null
  },

  async summary(id: string): Promise<VehicleSummary> {
    await delay(800)
    const index = Number(id.replace('v', ''))
    const v = FLEET[index]
    if (!v) throw new Error('Vehicle not found')
    const offline = v.status === 'offline'
    const running = offline ? 0 : 1 + ((index * 17) % 200)
    const idle = offline ? 0 : (index * 5) % 90
    const midnight = new Date()
    midnight.setHours(0, 0, 0, 0)
    const elapsed = Math.floor((Date.now() - midnight.getTime()) / MINUTE)
    return {
      odometerKm: 74.355 + index * 137.25,
      runningDistanceKm: offline ? 0 : 25.178 + index * 3.5,
      runningMinutes: running,
      idleMinutes: idle,
      stopMinutes: Math.max(0, elapsed - running - idle),
      totalWorkingMinutes: running + idle,
      fuelLitres: v.fuelPercent === null ? null : Math.round((v.fuelPercent / 100) * 166),
      countedFrom: midnight.toISOString(),
      address: 'Ahmedabad–Rajkot Highway, Limbdi Taluka, Surendranagar, Gujarat 363423, India',
      lat: 22.5726,
      lng: 71.8153,
      locked: lockState.get(id) ?? false,
    }
  },

  async setLocked(id: string, locked: boolean): Promise<void> {
    await delay(600)
    lockState.set(id, locked)
  },
}
