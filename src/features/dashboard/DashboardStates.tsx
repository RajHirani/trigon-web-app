import { VehicleCardSkeleton } from '@/components/vehicle/VehicleCardSkeleton'
import { VEHICLE_GRID } from './layout'

/** Placeholder while the first page loads. */
export function VehiclesSkeleton({ count }: { count: number }) {
  return (
    <div className={VEHICLE_GRID} role="status" aria-label="Loading vehicles">
      {Array.from({ length: count }, (_, i) => (
        <VehicleCardSkeleton key={i} />
      ))}
    </div>
  )
}
