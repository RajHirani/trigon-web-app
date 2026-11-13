export type VehicleStatus = 'moving' | 'idle' | 'stopped' | 'offline'

export type VehicleAlert = 'locationError' | 'networkError' | 'batteryDisconnected'

// State of the device's subscription plan; drives the KPI cards.
export type PlanState = 'active' | 'expiring' | 'expired'

export type Vehicle = {
  id: string
  plate: string
  vehicleType: string
  owner: string
  deviceType: string
  status: VehicleStatus
  /** km/h; null when the device is offline. */
  speed: number | null
  ignition: boolean | null
  ac: boolean | null
  fuelPercent: number | null
  alerts: VehicleAlert[]
  /** ISO timestamp of the last position/telemetry update. */
  lastUpdate: string
  planState: PlanState
}

/** 'total' = no plan filter. */
export type PlanFilter = 'total' | PlanState

export type VehicleKpis = Record<PlanFilter, number>

export type VehicleQuery = {
  plan: PlanFilter
  search: string
  /** null = all device types. */
  deviceType: string | null
  page: number
}

export type VehiclePage = {
  items: Vehicle[]
  /** Vehicles matching the query across all pages. */
  total: number
  pageSize: number
}
