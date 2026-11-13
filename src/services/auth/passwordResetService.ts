import { env } from '@/config/env'
import { mockPasswordResetBackend } from '@/mocks/mockPasswordResetBackend'

// The real endpoints are not confirmed yet. Implement these when the API step
// starts; the screens only depend on the exported functions below.
const apiBackend = {
  async requestReset(_email: string): Promise<void> {
    throw new Error('Password reset API is not integrated yet. Set VITE_USE_MOCK=true.')
  },
  async resetPassword(_token: string, _password: string): Promise<void> {
    throw new Error('Password reset API is not integrated yet. Set VITE_USE_MOCK=true.')
  },
}

// VITE_USE_MOCK=true runs everything on src/mocks until the API is integrated.
const backend = env.useMock ? mockPasswordResetBackend : apiBackend

/** Sends the reset link. Resolves the same for unknown emails; rejects on request failure. */
export function requestPasswordReset(email: string): Promise<void> {
  return backend.requestReset(email.trim())
}

/** Sets the new password. Rejects with AuthError('invalid_credentials') when the link is expired or invalid. */
export function resetPassword(token: string, password: string): Promise<void> {
  return backend.resetPassword(token, password)
}
