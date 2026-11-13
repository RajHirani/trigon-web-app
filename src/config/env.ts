import { z } from 'zod'

// Values come from .env.<mode> files (see package.json scripts). Everything
// here ends up in the browser bundle, so never put secrets in them.
const schema = z.object({
  VITE_APP_ENV: z.enum(['localhost', 'dev', 'prod']),
  VITE_API_BASE_URL: z.string().min(1),
  VITE_OAUTH_CLIENT_ID: z.string().min(1),
  VITE_MQTT_URL: z.string().min(1),
  // 'true' = run on mock data (src/mocks); 'false' = call trigon-api.
  VITE_USE_MOCK: z.enum(['true', 'false']),
})

const parsed = schema.safeParse(import.meta.env)
if (!parsed.success) {
  const missing = parsed.error.issues.map((i) => i.path.join('.')).join(', ')
  throw new Error(`Invalid environment configuration: ${missing}. Check the .env.<mode> file.`)
}

export const env = {
  appEnv: parsed.data.VITE_APP_ENV,
  apiBaseUrl: parsed.data.VITE_API_BASE_URL,
  oauthClientId: parsed.data.VITE_OAUTH_CLIENT_ID,
  useMock: parsed.data.VITE_USE_MOCK === 'true',
  mqtt: { url: parsed.data.VITE_MQTT_URL, keepaliveSeconds: 30, reconnectPeriodMs: 3000 },
} as const
