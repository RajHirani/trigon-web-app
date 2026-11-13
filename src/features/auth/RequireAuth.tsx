import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSessionStore } from '@/store/sessionStore'

// Gate for every signed-in route. Waits for the launch session check first.
export function RequireAuth() {
  const { user, restored } = useSessionStore()
  const location = useLocation()
  if (!restored) return <div className="grid h-full place-items-center text-sm text-ink-3">Loading…</div>
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Outlet />
}
