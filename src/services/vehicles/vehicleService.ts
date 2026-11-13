import { env } from '@/config/env'
import type { Vehicle, VehicleKpis, VehiclePage, VehicleQuery, VehicleSummary } from '@/features/dashboard/types'
import { mockVehicleBackend } from '@/mocks/mockVehicleBackend'

// Real trigon-api calls. TODO(api): the vehicles endpoints are not defined yet;
// implement these with `http` from '@/services/api/http' and keep the signatures.
const notReady = (name: string) => () => Promise.reject(new Error(`vehicleService.${name}: API not integrated yet`))

const apiBackend: typeof mockVehicleBackend = {
  getKpis: notReady('getKpis') as () => Promise<VehicleKpis>,
  list: notReady('list') as (q: VehicleQuery) => Promise<VehiclePage>,
  deviceTypes: notReady('deviceTypes') as () => Promise<string[]>,
  get: notReady('get') as (id: string) => Promise<Vehicle | null>,
  summary: notReady('summary') as (id: string) => Promise<VehicleSummary>,
  setLocked: notReady('setLocked') as (id: string, locked: boolean) => Promise<void>,
}

// VITE_USE_MOCK=true runs on src/mocks until the API is integrated.
const backend = env.useMock ? mockVehicleBackend : apiBackend

export const getVehicleKpis = () => backend.getKpis()
export const listVehicles = (query: VehicleQuery) => backend.list(query)
export const listDeviceTypes = () => backend.deviceTypes()
export const getVehicle = (id: string) => backend.get(id)
export const getVehicleSummary = (id: string) => backend.summary(id)
export const setDeviceLocked = (id: string, locked: boolean) => backend.setLocked(id, locked)
