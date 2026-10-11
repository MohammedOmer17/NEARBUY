import axios from 'axios'
import { API_BASE_URL } from '../config/env'

// Auth is an HTTP-only cookie set by the backend: never read or store the JWT here.
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 20000,
})

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.skipAuthEvent) {
      window.dispatchEvent(new Event('nearbuy:unauthorized'))
    }
    return Promise.reject(err)
  },
)

export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (err?.response) {
    const d = err.response.data
    return d?.message || d?.error || d?.errors?.[0]?.msg || fallback
  }
  if (err?.code === 'ERR_NETWORK' || err?.code === 'ECONNABORTED') {
    return 'Cannot reach NearBuy. Check your connection and try again.'
  }
  return err?.message || fallback
}
