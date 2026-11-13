import { queryClient } from '@/app/queryClient'
import { env } from '@/config/env'
import { rawClient } from '@/services/api/rawClient'
import { loadRoles } from '@/services/roles/roleService'
import { mockAuthBackend, type MeResponse, type TokenResponse } from '@/mocks/mockAuthBackend'
import { useRoleStore } from '@/store/roleStore'
import { useSessionStore, type SessionUser } from '@/store/sessionStore'
import { AuthError, toAuthError } from './authError'
import { getDeviceDescription } from './deviceInfo'
import { clearTokens, getDeviceId, getTokens, loadTokens, saveTokens, type Tokens } from './tokenStore'

// Talks to the OAuth endpoints of trigon-api. Everything here uses rawClient
// (no interceptors); authenticated app requests go through services/api/http.


// Real trigon-api calls. OAuth token requests are form-encoded (RFC 6749 section 4.3.2).
const apiBackend = {
  async postToken(params: Record<string, string>): Promise<TokenResponse> {
    const { data } = await rawClient.post<TokenResponse>(
      '/oauth/token',
      new URLSearchParams({ client_id: env.oauthClientId, ...params }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    )
    return data
  },
  async getMe(accessToken: string) {
    // Roles are needed to label and rank users, so load them with the profile.
    const [{ data }] = await Promise.all([
      rawClient.get<MeResponse>('/me', { headers: { Authorization: `Bearer ${accessToken}` } }),
      loadRoles(accessToken),
    ])
    return { me: data, roles: null }
  },
  async revoke(refreshToken: string): Promise<void> {
    await rawClient.post('/oauth/revoke', new URLSearchParams({ token: refreshToken }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
}

// VITE_USE_MOCK=true runs everything on src/mocks until the API is integrated.
const backend = env.useMock ? mockAuthBackend : apiBackend
const postToken = backend.postToken

const toTokens = (r: TokenResponse): Tokens => ({
  accessToken: r.access_token,
  accessTokenExpiresAt: Date.now() + r.expires_in * 1000,
  refreshToken: r.refresh_token,
})

async function fetchMe(accessToken: string): Promise<SessionUser> {
  const { me, roles } = await backend.getMe(accessToken)
  if (roles) useRoleStore.getState().setRoles(roles)
  return { id: me.id, name: me.name ?? me.email, role: me.role }
}

/** Rejects with an AuthError the sign-in screen can map to copy. */
export async function signIn(input: { email: string; password: string }): Promise<void> {
  try {
    const device = getDeviceDescription()
    const data = await postToken({
      grant_type: 'password',
      username: input.email,
      password: input.password,
      device_id: getDeviceId(),
      device_platform: device.platform,
      device_name: device.name,
      app_version: device.appVersion,
      os_version: device.osVersion,
    })
    const tokens = toTokens(data)
    const user = await fetchMe(tokens.accessToken)
    saveTokens(tokens)
    useSessionStore.getState().signIn(user)
  } catch (error) {
    throw error instanceof AuthError ? error : toAuthError(error)
  }
}

// Clears local state only; the server session is left to expire or be revoked.
function endSession(): void {
  clearTokens()
  queryClient.clear()
  useSessionStore.getState().signOut()
}

/** Revokes the server session (best effort), then signs out locally. */
export async function signOut(): Promise<void> {
  const tokens = getTokens()
  if (tokens) {
    await backend.revoke(tokens.refreshToken).catch(() => {})
  }
  endSession()
}

// One refresh at a time: parallel 401s share the same request, which matters
// because the server rotates the refresh token and treats reuse as theft.
let refreshing: Promise<string> | null = null

/** Exchanges the refresh token and returns the new access token. A rejected refresh token signs the user out; a network failure does not. */
export function refreshAccessToken(): Promise<string> {
  refreshing ??= (async () => {
    const tokens = getTokens()
    if (!tokens) throw new AuthError('invalid_credentials')
    try {
      const data = await postToken({ grant_type: 'refresh_token', refresh_token: tokens.refreshToken })
      const next = toTokens(data)
      saveTokens(next)
      return next.accessToken
    } catch (error) {
      const authError = toAuthError(error)
      if (authError.kind === 'invalid_credentials') endSession()
      throw authError
    }
  })().finally(() => {
    refreshing = null
  })
  return refreshing
}

/** Access token for the next request, refreshed first if about to expire. */
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = getTokens()
  if (!tokens) return null
  const EXPIRY_SKEW_MS = 30_000
  if (tokens.accessTokenExpiresAt - EXPIRY_SKEW_MS > Date.now()) return tokens.accessToken
  return refreshAccessToken()
}

/** Launch: restore the saved session, if any, then mark the check done. */
export async function restoreSession(): Promise<void> {
  try {
    if (!loadTokens()) return
    const accessToken = await getValidAccessToken()
    if (accessToken) useSessionStore.getState().signIn(await fetchMe(accessToken))
  } catch {
    // Rejected tokens were already cleared by the refresh; on a network
    // failure the tokens stay saved and the user lands on Sign in.
  } finally {
    useSessionStore.getState().setRestored()
  }
}
