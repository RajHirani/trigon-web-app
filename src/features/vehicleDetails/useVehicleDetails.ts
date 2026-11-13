import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getVehicle, getVehicleSummary, setDeviceLocked } from '@/services/vehicles/vehicleService'

export function useVehicle(id: string | undefined) {
  return useQuery({ queryKey: ['vehicle', id], queryFn: () => getVehicle(id!), enabled: !!id })
}

export function useVehicleSummary(id: string | undefined) {
  return useQuery({ queryKey: ['vehicle-summary', id], queryFn: () => getVehicleSummary(id!), enabled: !!id })
}

export function useSetDeviceLock(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (locked: boolean) => setDeviceLocked(id, locked),
    onSuccess: (_d, locked) => {
      client.setQueryData(['vehicle-summary', id], (old: { locked: boolean } | undefined) =>
        old ? { ...old, locked } : old,
      )
    },
  })
}
