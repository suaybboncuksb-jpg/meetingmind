import axios from 'axios'
import { clearAuthSession, getAuthToken } from '../auth/authStorage.js'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

const AUTH_ENDPOINTS = ['/auth/login', '/auth/register']

function isAuthEndpoint(url = '') {
  return AUTH_ENDPOINTS.some((endpoint) => url.endsWith(endpoint))
}

api.interceptors.request.use((config) => {
  const token = getAuthToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    if ((status === 401 || status === 403) && !isAuthEndpoint(error.config?.url)) {
      clearAuthSession()
      window.dispatchEvent(
        new CustomEvent('auth:logout', {
          detail: { reason: 'unauthorized' },
        }),
      )
    }

    return Promise.reject(error)
  },
)

export default api
