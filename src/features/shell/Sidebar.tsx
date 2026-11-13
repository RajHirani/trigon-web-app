import { faAnglesLeft, faAnglesRight, faRightFromBracket } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { NavLink, useLocation } from 'react-router-dom'
import { LogoMark } from '@/components/Logo'
import type { MenuGroup } from '@/config/menu'
import { signOut } from '@/services/auth/authService'

type Props = {
  groups: readonly MenuGroup[]
  /** Icon-only rail (desktop). The mobile drawer is never collapsed. */
  collapsed?: boolean
  onToggleCollapse?: () => void
  onNavigate?: () => void
}

export function Sidebar({ groups, collapsed = false, onToggleCollapse, onNavigate }: Props) {
  const { pathname } = useLocation()
  return (
    <aside
      className={`flex h-full flex-col bg-sidebar text-sidebar-text transition-[width] duration-200 ${
        collapsed ? 'w-[65px]' : 'w-60'
      }`}
    >
      <div className={`flex h-16 shrink-0 items-center gap-3 ${collapsed ? 'justify-center' : 'px-5'}`}>
        <LogoMark white className="h-7 w-8 shrink-0" />
        {!collapsed && <span className="text-lg font-semibold tracking-wide text-sidebar-active">TRIGON</span>}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-3">
        {groups.map((g) => (
          <div key={g.title} className="mt-4 first:mt-1">
            {collapsed ? (
              <div className="mx-2 mb-2 border-t border-sidebar-item" />
            ) : (
              <div className="px-3 pb-1.5 text-[9px] font-medium uppercase tracking-wider text-sidebar-caption">
                {g.title}
              </div>
            )}
            {g.items.map((i) => (
              <NavLink
                key={i.path}
                to={i.path}
                onClick={onNavigate}
                title={collapsed ? i.label : undefined}
                className={({ isActive }) =>
                  `mb-1 flex h-11 items-center rounded-lg text-sm transition-colors ${
                    collapsed ? 'justify-center px-0' : 'gap-3 px-3.5'
                  } ${
                    isActive || i.alsoActiveFor?.some((p) => pathname.startsWith(p))
                      ? 'bg-sidebar-item font-medium text-sidebar-active'
                      : 'hover:bg-sidebar-item/60'
                  }`
                }
              >
                <FontAwesomeIcon icon={i.icon} className="w-4 shrink-0" />
                {!collapsed && <span className="truncate">{i.label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-item p-3">
        <button
          onClick={() => void signOut()}
          title={collapsed ? 'Logout' : undefined}
          className={`flex w-full items-center rounded-lg py-2.5 text-sm hover:bg-sidebar-item/60 ${
            collapsed ? 'justify-center' : 'gap-3 px-3'
          }`}
        >
          <FontAwesomeIcon icon={faRightFromBracket} className="w-4 shrink-0" />
          {!collapsed && 'Logout'}
        </button>
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={`mt-1 flex w-full items-center rounded-lg py-2.5 text-sm hover:bg-sidebar-item/60 ${
              collapsed ? 'justify-center' : 'gap-3 px-3'
            }`}
          >
            <FontAwesomeIcon icon={collapsed ? faAnglesRight : faAnglesLeft} className="w-4 shrink-0" />
            {!collapsed && 'Collapse'}
          </button>
        )}
      </div>
    </aside>
  )
}
