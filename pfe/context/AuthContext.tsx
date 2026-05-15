'use client'

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { authApi } from '@/lib/api'
import { AUTH_CHANGED_EVENT, setAuth, clearAuth, getStoredUser, getToken, normalizeUser } from '@/lib/auth'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
}

interface RegisterData {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface AuthSnapshot {
  user: User | null
  token: string | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

const serverAuthSnapshot: AuthSnapshot = {
  user: null,
  token: null,
  isLoading: true,
}

let cachedAuthKey = ''
let cachedAuthSnapshot: AuthSnapshot = {
  user: null,
  token: null,
  isLoading: false,
}

const authListeners = new Set<() => void>()

function subscribeAuth(listener: () => void) {
  authListeners.add(listener)
  if (typeof window !== 'undefined') {
    window.addEventListener(AUTH_CHANGED_EVENT, listener)
  }

  return () => {
    authListeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener(AUTH_CHANGED_EVENT, listener)
    }
  }
}

function readClientAuthSnapshot(): AuthSnapshot {
  const storedToken = getToken()
  const storedUser = storedToken ? getStoredUser() : null
  const key = `${storedToken ?? ''}:${storedUser ? JSON.stringify(storedUser) : ''}`

  if (cachedAuthKey === key) return cachedAuthSnapshot

  cachedAuthKey = key
  cachedAuthSnapshot = {
    user: storedUser,
    token: storedToken,
    isLoading: false,
  }
  return cachedAuthSnapshot
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, token, isLoading } = useSyncExternalStore(
    subscribeAuth,
    readClientAuthSnapshot,
    () => serverAuthSnapshot
  )

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password })

    // Normalise — backend uses access_token + userInfo; future-proof for accessToken + user
    const rawUser = data.userInfo ?? data.user
    const jwt: string = data.access_token ?? data.accessToken

    if (!rawUser || !jwt) {
      throw new Error('Invalid response from server: missing user or token')
    }

    const normUser = normalizeUser(rawUser)
    setAuth(jwt, normUser)
  }, [])

  const register = useCallback(async (formData: RegisterData) => {
    const response = await authApi.register({
      name: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
      email: formData.email,
      password: formData.password,
    })

    const data = response.data ?? {}
    const rawUser = data.userInfo ?? data.user
    const jwt: string = data.access_token ?? data.accessToken ?? ''

    if (rawUser && jwt) {
      const normUser = normalizeUser(rawUser)
      setAuth(jwt, normUser)
      return
    }

    await login(formData.email, formData.password)
  }, [login])

  const logout = useCallback(() => {
    clearAuth()
    window.location.href = '/auth/login'
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAdmin: user?.role === 'ADMIN',
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
