import { faBars, faMoon, faRightFromBracket, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { MENU } from '@/config/menu'
import { signOut } from '@/services/auth/authService'
import { useThemeStore } from '@/store/themeStore'

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-text">
      <div className="px-5 py-5 text-lg font-semibold text-sidebar-active">TRIGON</div>
      <nav className="flex-1 overflow-y-auto px-2">
        {MENU.map((g) => (
          <div key={g.title} className="mb-3">
            <div className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-sidebar-caption">
              {g.title}
            </div>
            {g.items.map((i) => (
              <NavLink
                key={i.path}
                to={i.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                    isActive ? 'bg-sidebar-item text-sidebar-active' : 'hover:bg-sidebar-item/60'
                  }`
                }
              >
                <FontAwesomeIcon icon={i.icon} className="w-4" />
                {i.label}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <button onClick={() => void signOut()} className="m-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-sidebar-item/60">
        <FontAwesomeIcon icon={faRightFromBracket} className="w-4" />
        Logout
      </button>
    </aside>
  )
}

export function AppShell() {
  const [open, setOpen] = useState(false)
  const { mode, setMode } = useThemeStore()
  return (
    <div className="flex h-full">
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative h-full w-60" onClick={(e) => e.stopPropagation()}>
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:px-6">
          <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <FontAwesomeIcon icon={faBars} />
          </button>
          <div className="flex-1" />
          <button
            aria-label="Toggle theme"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-2"
          >
            <FontAwesomeIcon icon={mode === 'dark' ? faSun : faMoon} />
          </button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
