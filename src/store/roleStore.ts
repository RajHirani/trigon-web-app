import { create } from 'zustand'

export type RoleInfo = { code: string; label: string }

type RoleState = {
  /** Top of the hierarchy first, as served by trigon-api (`GET /roles`). */
  roles: readonly RoleInfo[]
  setRoles: (roles: readonly RoleInfo[]) => void
}

// In-memory: loaded with the session before the signed-in screens render.
export const useRoleStore = create<RoleState>()((set) => ({ roles: [], setRoles: (roles) => set({ roles }) }))

/** Position in the hierarchy (0 = top); unknown roles rank below everyone. */
export function roleRank(code: string): number {
  const { roles } = useRoleStore.getState()
  const i = roles.findIndex((r) => r.code === code)
  return i === -1 ? roles.length : i
}

/** Display name from the API; falls back to the raw code. */
export function roleLabel(code: string): string {
  return useRoleStore.getState().roles.find((r) => r.code === code)?.label ?? code
}
