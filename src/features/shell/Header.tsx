import { faBars, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { roleLabel } from '@/store/roleStore'
import { useSessionStore } from '@/store/sessionStore'
import { ThemeSwitcher } from './ThemeSwitcher'

type Props = { title: string; subtitle?: string; onOpenMenu: () => void }

// Top bar from Figma "Dashboard / Desktop / Light": 72px, title group left, actions right.
export function Header({ title, subtitle, onOpenMenu }: Props) {
  const user = useSessionStore((s) => s.user)
  const initials = (user?.name ?? '?')
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

  return (
    <header className="flex h-[72px] shrink-0 items-center gap-2 bg-surface px-3 sm:gap-3 sm:px-4 lg:px-6">
      <button
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink-2 hover:bg-surface-muted lg:hidden"
        aria-label="Open menu"
        onClick={onOpenMenu}
      >
        <FontAwesomeIcon icon={faBars} />
      </button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold leading-[33px] text-ink sm:text-[22px]">{title}</h1>
        {subtitle && <p className="hidden truncate text-xs leading-[18px] text-ink-3 sm:block">{subtitle}</p>}
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        <ThemeSwitcher />
        <div className="flex items-center gap-2.5 rounded-full border border-line bg-surface p-1.5 sm:pr-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-semibold text-on-primary">
            {initials}
          </div>
          <div className="hidden leading-tight sm:block">
            <div className="max-w-40 truncate text-[13px] font-semibold leading-5 text-ink">{user?.name}</div>
            <div className="text-[11px] leading-[17px] text-ink-3">{user ? roleLabel(user.role) : ''}</div>
          </div>
          <span className="hidden sm:block">
            <FontAwesomeIcon icon={faChevronDown} className="text-xs text-ink-3" />
          </span>
        </div>
      </div>
    </header>
  )
}
