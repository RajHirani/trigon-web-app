import { faBolt, faGasPump, faSnowflake } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { SpeedGauge } from './SpeedGauge'
import type { Vehicle } from '@/features/dashboard/types'
import {
  ActionButtons,
  Alerts,
  StatusPill,
  UpdatedPanel,
  ValuePill,
  VehicleIcon,
  type VehicleActions,
} from './VehicleParts'

function MetricRow({ icon, label, children, iconClass }: { icon: typeof faBolt; label: string; children: React.ReactNode; iconClass: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2 text-xs text-ink-2 @[380px]:text-[12px]">
        <FontAwesomeIcon icon={icon} className={`w-4 shrink-0 ${iconClass}`} />
        <span className="truncate">{label}</span>
      </span>
      {children}
    </div>
  )
}

/**
 * One vehicle card. It adapts to its own width (container queries), so the same
 * card fits a phone column, a four-per-row desktop grid and the wider Figma size.
 */
export function VehicleCard({ vehicle: v, ...actions }: { vehicle: Vehicle } & VehicleActions) {
  const ignition = v.ignition === null ? { t: '—', tone: 'off' as const } : v.ignition ? { t: 'On', tone: 'on' as const } : { t: 'Off', tone: 'off' as const }
  const ac = v.ac === null ? { t: '—', tone: 'off' as const } : v.ac ? { t: 'On', tone: 'onBlue' as const } : { t: 'Off', tone: 'off' as const }
  return (
    <div className="@container min-w-0">
      <article className="flex h-full flex-col gap-4 rounded-2xl border border-line bg-surface p-4 @[380px]:gap-5 @[380px]:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <VehicleIcon />
            <div className="min-w-0">
              <div className="truncate text-base font-semibold leading-6 text-ink">{v.plate}</div>
              <div className="truncate text-xs text-ink-3">
                {v.vehicleType} · {v.owner}
              </div>
            </div>
          </div>
          <StatusPill status={v.status} />
        </div>
        <div className="flex items-center gap-3">
          <SpeedGauge speed={v.speed} status={v.status} />
          <div className="flex min-w-0 flex-1 flex-col justify-around gap-3 self-stretch">
            <MetricRow icon={faBolt} label="Ignition" iconClass={v.ignition ? 'text-moving' : 'text-ink-3'}>
              <ValuePill text={ignition.t} tone={ignition.tone} />
            </MetricRow>
            <MetricRow icon={faSnowflake} label="AC" iconClass="text-ac">
              <ValuePill text={ac.t} tone={ac.tone} />
            </MetricRow>
            <MetricRow icon={faGasPump} label="Fuel" iconClass="text-ink-3">
              <ValuePill text={v.fuelPercent === null ? '—' : `~${v.fuelPercent}%`} tone="plain" />
            </MetricRow>
          </div>
        </div>
        <div className="flex min-h-7 items-center">
          <Alerts alerts={v.alerts} />
        </div>
        <UpdatedPanel vehicle={v} />
        <ActionButtons vehicle={v} {...actions} />
      </article>
    </div>
  )
}
