import { create } from 'zustand'

export type ThemeMode = 'light' | 'dark'
const KEY = 'trigon.theme'

function initial(): ThemeMode {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage unavailable */
  }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* ignore */
  }
}

type State = { mode: ThemeMode; setMode: (m: ThemeMode) => void }

export const useThemeStore = create<State>((set) => {
  const mode = initial()
  apply(mode)
  return {
    mode,
    setMode: (m) => {
      apply(m)
      set({ mode: m })
    },
  }
})
