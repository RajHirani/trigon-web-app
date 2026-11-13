import { rawClient } from '@/services/api/rawClient'
import { useRoleStore, type RoleInfo } from '@/store/roleStore'

/** Loads the role list (needs a token: called while the session is starting). */
export async function loadRoles(accessToken: string): Promise<void> {
  const { data } = await rawClient.get<{ roles: RoleInfo[] }>('/roles', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  useRoleStore.getState().setRoles(data.roles)
}
