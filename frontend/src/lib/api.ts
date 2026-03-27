import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1'
const IA_URL = process.env.NEXT_PUBLIC_IA_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const iaApi = axios.create({
  baseURL: IA_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear tokens and redirect on 401 if we actually had a token
    // This means the token expired, not that the endpoint requires different permissions
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      const hadToken = !!error.config?.headers?.Authorization
      // Only redirect on 401 if we sent a token (meaning it expired/is invalid)
      // and it's not an auth endpoint (login/register handle their own errors)
      if (hadToken && !url.includes('/auth/')) {
        // Don't redirect - just let the error propagate
        // The DashboardLayout already checks auth state
      }
    }
    return Promise.reject(error)
  }
)
