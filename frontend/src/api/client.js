import axios from 'axios'
import { clearAuthSession, getAuthToken } from '../auth/authStorage.js'

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const api = axios.create({
  baseURL: API_BASE_URL,
})

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

    if (status === 401 || status === 403) {
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
