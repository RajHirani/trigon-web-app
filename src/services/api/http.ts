import axios from 'axios'
import { env } from '@/config/env'
import { getValidAccessToken, refreshAccessToken } from '@/services/auth/authService'

// Client for every authenticated API call. Adds the bearer token and, on a
// 401, refreshes once and replays the request.
export const http = axios.create({ baseURL: env.apiBaseUrl, timeout: 15_000 })

http.interceptors.request.use(async (config) => {
  const accessToken = await getValidAccessToken()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

http.interceptors.response.use(undefined, async (error) => {
  const original = error.config as (typeof error.config & { _retried?: boolean }) | undefined
  if (error.response?.status !== 401 || !original || original._retried) throw error
  original._retried = true
  const accessToken = await refreshAccessToken().catch(() => null)
  if (!accessToken) throw error
  original.headers.Authorization = `Bearer ${accessToken}`
  return http(original)
})
