import { AuthError } from '@/services/auth/authError'

// Mock of the trigon-api OAuth endpoints, used while VITE_USE_MOCK=true.
// Sign in with any user below and password "Trigon@123".
export const MOCK_PASSWORD = 'Trigon@123'

type MockUser = { id: string; email: string; name: string; role: string; active: boolean }

export const MOCK_USERS: readonly MockUser[] = [
  { id: 'u1', email: 'admin@trigon.test', name: 'Fleet Admin', role: 'ADMIN', active: true },
  { id: 'u2', email: 'dealer@trigon.test', name: 'Rajesh Mehta', role: 'DEALER', active: true },
  { id: 'u3', email: 'retailer@trigon.test', name: 'Juned Qureshi', role: 'RETAILER', active: true },
  { id: 'u4', email: 'user@trigon.test', name: 'Amit Patel', role: 'END_USER', active: true },
  { id: 'u5', email: 'deactivated@trigon.test', name: 'Neha Joshi', role: 'DEALER', active: false },
]

const MOCK_ROLES = [
  { code: 'ADMIN', label: 'Administrator' },
  { code: 'DEALER', label: 'Dealer' },
  { code: 'RETAILER', label: 'Retailer' },
  { code: 'END_USER', label: 'End User' },
]

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

// Fake tokens carry the user id so the mock can answer /me without a server.
const TOKEN_TTL_S = 60 * 60 * 24

export type TokenResponse = { access_token: string; expires_in: number; refresh_token: string }
export type MeResponse = { id: string; email: string; name: string | null; role: string }

const tokenFor = (userId: string): TokenResponse => ({
  access_token: `mock-access.${userId}`,
  expires_in: TOKEN_TTL_S,
  refresh_token: `mock-refresh.${userId}`,
})
const userIdFromToken = (token: string) => token.split('.')[1]

export const mockAuthBackend = {
  async postToken(params: Record<string, string>): Promise<TokenResponse> {
    await delay(700)
    if (params.grant_type === 'refresh_token') {
      const id = userIdFromToken(params.refresh_token ?? '')
      if (!MOCK_USERS.some((u) => u.id === id)) throw new AuthError('invalid_credentials')
      return tokenFor(id)
    }
    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === (params.username ?? '').trim().toLowerCase())
    if (!user || params.password !== MOCK_PASSWORD) throw new AuthError('invalid_credentials')
    if (!user.active) throw new AuthError('deactivated')
    return tokenFor(user.id)
  },

  async getMe(accessToken: string): Promise<{ me: MeResponse; roles: { code: string; label: string }[] }> {
    await delay(200)
    const user = MOCK_USERS.find((u) => u.id === userIdFromToken(accessToken))
    if (!user) throw new AuthError('invalid_credentials')
    return { me: { id: user.id, email: user.email, name: user.name, role: user.role }, roles: MOCK_ROLES }
  },

  async revoke(): Promise<void> {
    await delay(100)
  },
}
