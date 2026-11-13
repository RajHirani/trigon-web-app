import { faMagnifyingGlass, faTriangleExclamation, faTruck } from '@fortawesome/free-solid-svg-icons'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { EmptyState, VehiclesSkeleton } from './DashboardStates'
import { KpiRow } from './KpiRow'
import { Pagination } from './Pagination'
import { PAGE_SIZE_HINT, VEHICLE_GRID } from './layout'
import { DeviceTypeFilter, SearchBox } from './Toolbar'
import type { PlanFilter, Vehicle } from './types'
import { useDeviceTypes, useVehicleKpis, useVehicles } from './useVehicles'
import { VehicleCard } from './VehicleViews'

const SKELETONS = 9

export default function DashboardPage() {
  const navigate = useNavigate()
  const [plan, setPlan] = useState<PlanFilter>('total')
  const [searchText, setSearchText] = useState('')
  // What is typed vs. what is searched: a search runs on Enter, or when the box is emptied.
  const [search, setSearch] = useState('')
  const [deviceType, setDeviceType] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const query = useMemo(() => ({ plan, search, deviceType, page }), [plan, search, deviceType, page])
  const vehicles = useVehicles(query)
  const kpis = useVehicleKpis()
  const deviceTypes = useDeviceTypes()

  const changePlan = (next: PlanFilter) => {
    setPlan(next)
    setPage(1)
  }
  const changeDeviceType = (next: string | null) => {
    setDeviceType(next)
    setPage(1)
  }
  const changeSearch = (text: string) => {
    setSearchText(text)
    if (text.trim() === '') {
      setSearch('')
      setPage(1)
    }
  }
  const submitSearch = () => {
    setSearch(searchText.trim())
    setPage(1)
  }
  const clearSearch = () => changeSearch('')
  const clearFilters = () => {
    changeSearch('')
    setPlan('total')
    setDeviceType(null)
    setPage(1)
  }
  const goToPage = (next: number) => {
    setPage(next)
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // TODO: Play Back screen is not built yet.
  const actions = {
    onLiveTrack: (v: Vehicle) => navigate(`/live/${v.id}`),
    onPlayBack: undefined,
    onViewMore: (v: Vehicle) => navigate(`/dashboard/${v.id}`),
  }

  const data = vehicles.data
  // First load, and every later page / filter change: the previous results stay in `data` but are not shown.
  const loading = vehicles.isPending || vehicles.isPlaceholderData
  const noVehiclesAtAll = kpis.data?.total === 0
  const pageCount = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1

  let counter: string
  if (noVehiclesAtAll) counter = 'No vehicles'
  else if (!data || loading) counter = 'Loading vehicles…'
  else if (data.total === 0) counter = `Showing 0 of ${kpis.data?.total ?? 0} vehicles`
  else {
    const from = (page - 1) * data.pageSize + 1
    const to = from + data.items.length - 1
    counter = `Showing ${from}–${to} of ${data.total} vehicles`
  }

  let content: React.ReactNode
  if (loading) {
    content = <VehiclesSkeleton count={SKELETONS} />
  } else if (vehicles.isError) {
    // TODO(design): error state is not designed; generic copy.
    content = (
      <EmptyState
        icon={faTriangleExclamation}
        title="Couldn’t load vehicles"
        description="Check your connection and try again."
        actionLabel="Try again"
        onAction={() => void vehicles.refetch()}
      />
    )
  } else if (noVehiclesAtAll) {
    content = (
      <EmptyState
        icon={faTruck}
        title="No vehicles yet"
        description="Vehicles show up here as soon as a GPS device is installed and assigned to your account."
        actionLabel="Add a device"
        onAction={() => navigate('/devices')}
      />
    )
  } else if (data && data.items.length === 0) {
    const bySearch = search.length > 0
    content = (
      <EmptyState
        icon={faMagnifyingGlass}
        title={bySearch ? `No vehicles match “${search}”` : 'No vehicles match these filters'}
        description={
          bySearch
            ? `Check the plate number for typos, or clear the search and filters to see all ${kpis.data?.total ?? ''} vehicles.`.replace('  ', ' ')
            : 'Try a different plan or device type.'
        }
        actionLabel={bySearch ? 'Clear search' : 'Clear filters'}
        onAction={bySearch ? clearSearch : clearFilters}
      />
    )
  } else if (data) {
    content = (
      <div>
        <div className={VEHICLE_GRID}>
          {data.items.map((v) => (
            <VehicleCard key={v.id} vehicle={v} {...actions} />
          ))}
        </div>
      </div>
    )
  }

  const showPager = !!data && !loading && data.total > 0 && !vehicles.isError
  // Figma shows the pager while loading: draw it from the fleet size once that is known.
  const loadingPages = kpis.data && kpis.data.total > 0 ? Math.ceil(kpis.data.total / PAGE_SIZE_HINT) : 0

  return (
    <div className="flex min-h-full flex-col gap-5">
      <KpiRow kpis={kpis.data} selected={plan} onSelect={changePlan} />

      <div className="flex flex-wrap items-center gap-3">
        <SearchBox value={searchText} onChange={changeSearch} onSubmit={submitSearch} />
        <DeviceTypeFilter options={deviceTypes.data ?? []} selected={deviceType} onSelect={changeDeviceType} />
        <span className="text-[13px] text-ink-3 sm:ml-auto">{counter}</span>
      </div>

      <div className="flex-1">{content}</div>

      {showPager && <Pagination page={page} pageCount={pageCount} pageSize={data.pageSize} onChange={goToPage} />}
      {loading && !vehicles.isError && (data ? data.total > 0 : loadingPages > 0) && (
        <Pagination
          page={page}
          pageCount={data ? pageCount : loadingPages}
          pageSize={data?.pageSize ?? PAGE_SIZE_HINT}
          onChange={goToPage}
          loading
        />
      )}
    </div>
  )
}
