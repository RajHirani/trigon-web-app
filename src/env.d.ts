/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_ENV: 'localhost' | 'dev' | 'prod'
  readonly VITE_API_BASE_URL: string
  readonly VITE_OAUTH_CLIENT_ID: string
  readonly VITE_MQTT_URL: string
  readonly VITE_USE_MOCK: 'true' | 'false'
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare const __APP_VERSION__: string
