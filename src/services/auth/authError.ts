import axios from 'axios'

export type AuthErrorKind = 'invalid_credentials' | 'deactivated' | 'rate_limited' | 'network' | 'unknown'

// What the sign-in screen switches on. Built from the OAuth error body
// ({ error, error_description }) returned by the token endpoint.
export class AuthError extends Error {
  readonly kind: AuthErrorKind
  readonly retryAfterSeconds?: number
  constructor(kind: AuthErrorKind, retryAfterSeconds?: number) {
    super(kind)
    this.kind = kind
    this.retryAfterSeconds = retryAfterSeconds
  }
}

export function toAuthError(error: unknown): AuthError {
  if (!axios.isAxiosError(error)) return new AuthError('unknown')
  if (!error.response) return new AuthError('network')

  const code = (error.response.data as { error?: string } | undefined)?.error
  switch (code) {
    case 'invalid_grant':
      return new AuthError('invalid_credentials')
    case 'access_denied':
      return new AuthError('deactivated')
    case 'rate_limited': {
      const retryAfter = Number(error.response.headers['retry-after'])
      return new AuthError('rate_limited', Number.isFinite(retryAfter) ? retryAfter : undefined)
    }
    default:
      return new AuthError('unknown')
  }
}
