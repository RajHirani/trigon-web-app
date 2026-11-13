export type Tokens = {
  accessToken: string
  /** Epoch ms when the access token expires. */
  accessTokenExpiresAt: number
  refreshToken: string
}

const TOKENS_KEY = 'trigon.auth.tokens'
const DEVICE_KEY = 'trigon.auth.device'

// SECURITY NOTE: localStorage is readable by any script on the page, so an XSS
// bug could steal the refresh token. Acceptable for now; the hardening option
// is an httpOnly refresh cookie issued by trigon-api (needs a backend change).
let cache: Tokens | null = null

export const getTokens = (): Tokens | null => cache

/** Loads the persisted tokens into memory (call once at launch). */
export function loadTokens(): Tokens | null {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    cache = raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    cache = null
  }
  return cache
}

export function saveTokens(tokens: Tokens): void {
  cache = tokens
  try {
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  } catch {
    /* storage unavailable: session lasts until the tab closes */
  }
}

export function clearTokens(): void {
  cache = null
  try {
    localStorage.removeItem(TOKENS_KEY)
  } catch {
    /* ignore */
  }
}

// Stable per-browser id sent at sign-in so the server can list/revoke this
// session. Not a secret; it outlives sign-out.
export function getDeviceId(): string {
  try {
    const stored = localStorage.getItem(DEVICE_KEY)
    if (stored) return stored
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}
