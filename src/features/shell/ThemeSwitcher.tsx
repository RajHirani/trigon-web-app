import { faMoon, faSun } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { useThemeStore, type ThemeMode } from '@/store/themeStore'

const SEGMENTS: { value: ThemeMode; label: string; icon: typeof faSun }[] = [
  { value: 'light', label: 'Light', icon: faSun },
  { value: 'dark', label: 'Dark', icon: faMoon },
]

/** Light / Dark pill from the Figma top bar. Picking one overrides "follow the OS". */
export function ThemeSwitcher() {
  const { mode, setPreference } = useThemeStore()
  return (
    <div role="radiogroup" aria-label="Theme" className="flex rounded-full bg-toggle-track p-1">
      {SEGMENTS.map((s) => {
        const active = mode === s.value
        return (
          <button
            key={s.value}
            role="radio"
            aria-checked={active}
            aria-label={s.label}
            onClick={() => setPreference(s.value)}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-[7px] text-[13px] font-medium md:pl-3 md:pr-3.5 ${
              active ? 'bg-toggle-active text-ink shadow-[0_1px_4px_rgba(15,27,45,0.1)]' : 'text-ink-3'
            }`}
          >
            <FontAwesomeIcon icon={s.icon} className={`text-[14px] ${active ? 'text-toggle-active-icon' : ''}`} />
            <span className="hidden md:inline">{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}
