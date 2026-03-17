'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'CORRETORA' | 'ADMINISTRADORA' | 'SINDICO'
  organizationName?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (data: RegisterData) => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  role: string
  organizationName?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper to set token cookie for Next.js middleware access
function setTokenCookie(token: string) {
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function removeTokenCookie() {
  document.cookie = 'token=; path=/; max-age=0; SameSite=Lax'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setTokenCookie(token)
    } else {
      removeTokenCookie()
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    console.log('AuthContext: Making login request...')
    const response = await api.post('/auth/login', { email, password })
    console.log('AuthContext: Login response received:', response.data)
    const { accessToken, refreshToken, user: userData } = response.data

    console.log('AuthContext: Storing tokens...')
    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setTokenCookie(accessToken)

    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setUser(userData)

    console.log('AuthContext: Redirecting to dashboard...')
    // Use window.location for more reliable navigation after login
    window.location.href = '/dashboard'
  }

  const register = async (data: RegisterData) => {
    const response = await api.post('/auth/register', data)
    const { accessToken, refreshToken, user: userData } = response.data

    localStorage.setItem('token', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    setTokenCookie(accessToken)

    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
    setUser(userData)

    // Use window.location for more reliable navigation after register
    window.location.href = '/dashboard'
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Proceed with local logout even if backend call fails
    }
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    removeTokenCookie()
    delete api.defaults.headers.common['Authorization']
    setUser(null)
    router.push('/')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
