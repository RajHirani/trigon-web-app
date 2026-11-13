import { create } from 'zustand'
import { roleRank } from './roleStore'

export type SessionUser = { id: string; name: string; role: string }

type SessionState = {
  user: SessionUser | null
  /** False until the saved session has been checked at launch. */
  restored: boolean
  signIn: (user: SessionUser) => void
  signOut: () => void
  setRestored: () => void
}

// In-memory only: tokens live in services/auth/tokenStore and the user is
// re-fetched from /me at launch. Use authService.signIn / signOut from UI code.
export const useSessionStore = create<SessionState>()((set) => ({
  user: null,
  restored: false,
  signIn: (user) => set({ user }),
  signOut: () => set({ user: null }),
  setRestored: () => set({ restored: true }),
}))

/** The top of the role hierarchy (the administrator). */
export const useIsAdmin = () => useSessionStore((s) => (s.user ? roleRank(s.user.role) === 0 : false))

/** An end user: only edits a few details of the devices shared with them. */
export const useIsEndUser = () => useSessionStore((s) => s.user?.role === 'END_USER')
