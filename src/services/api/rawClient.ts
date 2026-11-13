import axios from 'axios'
import { env } from '@/config/env'

// Plain axios instance with no auth interceptors. The OAuth calls (token,
// revoke) use it so a failing refresh can never trigger another refresh.
export const rawClient = axios.create({ baseURL: env.apiBaseUrl, timeout: 15_000 })
