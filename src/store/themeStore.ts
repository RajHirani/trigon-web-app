import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'
export type ThemePreference = ThemeMode | 'system'
const KEY = 'trigon.theme'

const systemQuery = () => matchMedia('(prefers-color-scheme: dark)')
const resolve = (p: ThemePreference): ThemeMode => (p === 'system' ? (systemQuery().matches ? 'dark' : 'light') : p)

function initial(): ThemePreference {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
  } catch {
    /* storage unavailable */
  }
  return 'system'
}

function apply(preference: ThemePreference): ThemeMode {
  const mode = resolve(preference)
  document.documentElement.dataset.theme = mode
  document.documentElement.style.colorScheme = mode
  try {
    localStorage.setItem(KEY, preference)
  } catch {
    /* ignore */
  }
  return mode
}

type State = {
  /** What the user picked. */
  preference: ThemePreference
  /** The theme actually shown (`system` resolved). */
  mode: ThemeMode
  setPreference: (p: ThemePreference) => void
  /** Kept for callers that only switch between the two themes. */
  setMode: (m: ThemeMode) => void
}

export const useThemeStore = create<State>((set, get) => {
  const preference = initial()
  const mode = apply(preference)
  // Follow the OS while the preference is "system".
  systemQuery().addEventListener('change', () => {
    if (get().preference === 'system') set({ mode: apply('system') })
  })
  const setPreference = (p: ThemePreference) => set({ preference: p, mode: apply(p) })
  return { preference, mode, setPreference, setMode: setPreference }
})
