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
    if (error.response?.status === 401) {
      const url = error.config?.url || ''
      // Don't redirect on auth endpoints or dashboard data endpoints that may fail
      if (!url.includes('/auth/') && !url.includes('/dashboard/') && !url.includes('/notificacoes/')) {
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        const secure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : ''
        document.cookie = `token=; path=/; max-age=0; SameSite=Lax${secure}`
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)
