// Shapes and tones follow Figma "Dashboard / Desktop / Light · Loading" (Skeleton Card, 396 x 420).
// Strong = skeleton, soft = skeleton-soft, panel = skeleton-panel. Pulse only when motion is allowed.
const PULSE = 'motion-safe:animate-pulse'
const strong = (cls: string) => <div className={`${PULSE} bg-skeleton ${cls}`} />
const soft = (cls: string) => <div className={`${PULSE} bg-skeleton-soft ${cls}`} />

export function VehicleCardSkeleton() {
  return (
    <div className="@container min-w-0" aria-hidden>
      <div className="flex h-full flex-col gap-4 rounded-[18px] border border-line bg-surface p-4 @[380px]:gap-0 @[380px]:px-6 @[380px]:pb-[21px] @[380px]:pt-6 [&>*:nth-child(2)]:@[380px]:mt-[25px] [&>*:nth-child(3)]:@[380px]:mt-8 [&>*:nth-child(4)]:@[380px]:mt-7 [&>*:nth-child(5)]:@[380px]:mt-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {strong('h-11 w-11 shrink-0 rounded-xl')}
            <div className="flex flex-col gap-2">
              {strong('h-4 w-[108px] rounded-md')}
              {soft('h-3 w-[83px] rounded-md')}
            </div>
          </div>
          {strong('h-7 w-20 shrink-0 rounded-full')}
        </div>
        <div className="flex items-center gap-4 @[380px]:gap-0">
          <div className="flex flex-1 justify-center">{soft('h-[108px] w-[108px] rounded-full')}</div>
          <div className="flex w-[45%] max-w-[140px] shrink-0 flex-col gap-[20px] @[380px]:w-[140px]">
            {soft('h-5 w-full rounded-[9px]')}
            {soft('h-5 w-full rounded-[9px]')}
            {soft('h-5 w-full rounded-[9px]')}
          </div>
        </div>
        {soft('h-3.5 w-[117px] rounded-[6px]')}
        {/* the panel colour is a lighter tone than the bars, so it is not pulsed separately */}
        <div className={`${PULSE} h-12 rounded-[13px] bg-skeleton-panel`} />
        <div className="flex gap-2">
          {strong('h-10 flex-1 rounded-[9px]')}
          {soft('h-10 flex-1 rounded-[9px]')}
          {soft('h-10 flex-1 rounded-[9px]')}
        </div>
      </div>
    </div>
  )
}
