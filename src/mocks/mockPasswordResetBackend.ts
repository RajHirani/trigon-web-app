import { AuthError } from '@/services/auth/authError'

// Mock of the password reset endpoints, used while VITE_USE_MOCK=true.
// Like a real server, requesting a link answers the same for known and unknown
// emails (no account enumeration).
// Demo values: FAILING_EMAIL fails the request; /reset-password?token=EXPIRED_TOKEN
// (or no token) shows the expired-link state; any other token works.
export const FAILING_EMAIL = 'fail@trigon.test'
export const EXPIRED_TOKEN = 'expired'

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

export const mockPasswordResetBackend = {
  async requestReset(email: string): Promise<void> {
    await delay(700)
    if (email.trim().toLowerCase() === FAILING_EMAIL) throw new AuthError('network')
  },

  async resetPassword(token: string, _password: string): Promise<void> {
    await delay(700)
    if (!token || token === EXPIRED_TOKEN) throw new AuthError('invalid_credentials')
  },
}
