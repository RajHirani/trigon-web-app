import { useEffect, useMemo, useState } from 'react'
import { matchPath, Outlet, useLocation } from 'react-router-dom'
import { MENU } from '@/config/menu'
import { useVehicle } from '@/features/vehicleDetails/useVehicleDetails'
import { useSessionStore } from '@/store/sessionStore'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

const COLLAPSE_KEY = 'trigon.sidebar.collapsed'

function loadCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

/** Current time, refreshed every 30s (e.g. "20 Oct 2026, 1:17 PM"). */
function useNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

const formatNow = (d: Date) =>
  `${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`

export function AppShell() {
  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(loadCollapsed)
  const role = useSessionStore((s) => s.user?.role)
  const { pathname } = useLocation()

  // Hide items the signed-in role cannot use; drop groups left empty.
  const groups = useMemo(
    () =>
      MENU.map((g) => ({ ...g, items: g.items.filter((i) => !i.roles || (role && i.roles.includes(role))) })).filter(
        (g) => g.items.length > 0,
      ),
    [role],
  )
  // Live Track and Playback are full-screen maps: no header, no page padding. The sidebar is the same as on every page.
  const fullScreen = pathname.startsWith('/live/') || pathname.startsWith('/playback/')
  const detailId = matchPath('/dashboard/:vehicleId', pathname)?.params.vehicleId
  const detailVehicle = useVehicle(detailId)
  const menuTitle = groups.flatMap((g) => g.items).find((i) => pathname.startsWith(i.path))?.label ?? 'TRIGON'
  const title = detailId ? 'Vehicle details' : menuTitle

  const now = useNow()
  const subtitle = detailId
    ? `Dashboard › ${detailVehicle.data?.plate ?? '…'}`
    : pathname.startsWith('/dashboard')
      ? `Live fleet status · ${formatNow(now)}`
      : undefined

  useEffect(() => {
    if (!drawer) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [drawer])

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        /* ignore */
      }
      return !c
    })

  return (
    <div className="flex h-full bg-app text-ink">
      <div className="hidden lg:block">
        <Sidebar groups={groups} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      </div>
      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setDrawer(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative h-full w-60" onClick={(e) => e.stopPropagation()}>
            <Sidebar groups={groups} onNavigate={() => setDrawer(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        {!fullScreen && <Header title={title} subtitle={subtitle} onOpenMenu={() => setDrawer(true)} />}
        <main className={fullScreen ? 'min-h-0 flex-1 overflow-hidden' : 'min-h-0 flex-1 overflow-y-auto p-4 lg:p-6'}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
