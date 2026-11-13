import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getVehicleKpis, listDeviceTypes, listVehicles } from '@/services/vehicles/vehicleService'
import type { VehicleQuery } from './types'

export function useVehicles(query: VehicleQuery) {
  return useQuery({
    queryKey: ['vehicles', query],
    queryFn: () => listVehicles(query),
    // Keep the old page on screen while the next one loads (no skeleton flash).
    placeholderData: keepPreviousData,
  })
}

export function useVehicleKpis() {
  return useQuery({ queryKey: ['vehicle-kpis'], queryFn: getVehicleKpis })
}

export function useDeviceTypes() {
  return useQuery({ queryKey: ['device-types'], queryFn: listDeviceTypes, staleTime: Infinity })
}
