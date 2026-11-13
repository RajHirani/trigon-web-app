import { faClock, faClockRotateLeft, faLocationCrosshairs, faTriangleExclamation, faTruck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '@/features/dashboard/DashboardStates'
import { formatAgo, formatDayStart, formatFullDateTimeSeconds } from '@/features/dashboard/format'
import { StatusPill, VehicleIcon } from '@/features/dashboard/VehicleParts'
import { LockDialog } from './LockDialog'
import { AddressCard, SummarySkeleton, SummaryTiles } from './SummaryTiles'
import { useSetDeviceLock, useVehicle, useVehicleSummary } from './useVehicleDetails'

const BTN = 'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-[13px] font-medium'
const PULSE = 'motion-safe:animate-pulse'

// "View More" screen. Figma: Dashboard / Desktop / Light · View More (+ Dark, Loading, Lock device dialog).
export default function VehicleDetailsPage() {
  const { vehicleId } = useParams()
  const navigate = useNavigate()
  const vehicle = useVehicle(vehicleId)
  const summary = useVehicleSummary(vehicleId)
  const lock = useSetDeviceLock(vehicleId ?? '')
  const [confirmOpen, setConfirmOpen] = useState(false)

  const closeConfirm = useCallback(() => {
    setConfirmOpen(false)
    lock.reset()
  }, [lock])

  if (vehicle.isError || (vehicle.isSuccess && vehicle.data === null)) {
    return (
      <EmptyState
        icon={vehicle.isError ? faTriangleExclamation : faTruck}
        title={vehicle.isError ? 'Couldn’t load this vehicle' : 'Vehicle not found'}
        description={
          vehicle.isError
            ? 'Something went wrong while loading the vehicle. Please try again.'
            : 'This vehicle doesn’t exist or isn’t on your account any more.'
        }
        actionLabel="Back to dashboard"
        onAction={() => navigate('/dashboard')}
      />
    )
  }

  const v = vehicle.data
  const offline = v?.status === 'offline'

  const onToggleLock = () => {
    if (!summary.data) return
    if (summary.data.locked) lock.mutate(false)
    else setConfirmOpen(true)
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        {v ? (
          <>
            <div className="flex min-w-0 flex-1 basis-80 items-start gap-4">
              <VehicleIcon />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="text-[22px] font-semibold leading-[33px] text-ink">{v.plate}</h2>
                  <StatusPill status={v.status} />
                </div>
                <p className="text-[13px] text-ink-3">
                  {v.vehicleType} · {v.owner}
                </p>
                <p className="mt-2 flex items-center gap-2 text-xs font-medium text-ink-2">
                  <FontAwesomeIcon icon={faClock} className={offline ? 'text-stopped' : 'text-primary'} />
                  <span>
                    {offline ? 'Last seen' : 'Updated'} {formatAgo(v.lastUpdate)} · {formatFullDateTimeSeconds(v.lastUpdate)}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className={`${BTN} bg-primary text-on-primary hover:bg-primary-hover`} onClick={() => navigate(`/live/${v.id}`)}>
                <FontAwesomeIcon icon={faLocationCrosshairs} />
                Live Track
              </button>
              <button
                className={`${BTN} border border-line bg-surface text-control hover:bg-surface-muted`}
                disabled
                title="Play Back is not built yet"
              >
                <FontAwesomeIcon icon={faClockRotateLeft} />
                Play Back
              </button>
            </div>
          </>
        ) : (
          <div aria-hidden className="flex w-full items-start gap-4">
            <div className={`${PULSE} h-11 w-11 shrink-0 rounded-xl bg-skeleton`} />
            <div className="flex flex-col gap-2">
              <div className={`${PULSE} h-6 w-[200px] rounded-md bg-skeleton`} />
              <div className={`${PULSE} h-3 w-[140px] rounded-md bg-skeleton-soft`} />
              <div className={`${PULSE} h-3 w-[260px] rounded-md bg-skeleton-soft`} />
            </div>
          </div>
        )}
      </section>

      <div>
        <h2 className="text-[17px] font-semibold leading-[26px] text-ink">Today’s summary</h2>
        <p className="text-[13px] text-ink-3">
          {summary.data
            ? `Running, idle and stop times are counted from ${formatDayStart(summary.data.countedFrom)}.`
            : 'Running, idle and stop times are counted from midnight.'}
        </p>
      </div>

      {summary.isError ? (
        <EmptyState
          icon={faTriangleExclamation}
          title="Couldn’t load today’s summary"
          description="Check your connection and try again."
          actionLabel="Try again"
          onAction={() => void summary.refetch()}
        />
      ) : !summary.data ? (
        <SummarySkeleton />
      ) : (
        <>
          <SummaryTiles
            summary={summary.data}
            fuelPercent={v?.fuelPercent ?? null}
            lockBusy={lock.isPending}
            onToggleLock={onToggleLock}
          />
          <AddressCard address={summary.data.address} lat={summary.data.lat} lng={summary.data.lng} />
          {lock.isError && !confirmOpen && (
            <p role="alert" className="text-[13px] text-error-text">
              Couldn’t unlock the device. Please try again.
            </p>
          )}
        </>
      )}

      {confirmOpen && v && (
        <LockDialog
          plate={v.plate}
          pending={lock.isPending}
          error={lock.isError}
          onCancel={closeConfirm}
          onConfirm={() => lock.mutate(true, { onSuccess: () => setConfirmOpen(false) })}
        />
      )}
    </div>
  )
}
