'use client'

import {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { authApi } from '@/lib/api'
import { setAuth, clearAuth, getStoredUser, getToken } from '@/lib/auth'
import type { User, UserRole } from '@/types'

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
  role?: string
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
  return () => authListeners.delete(listener)
}

function emitAuthChange() {
  authListeners.forEach(listener => listener())
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

/**
 * Normalise whatever shape the backend sends into the frontend User type.
 *
 * Backend currently returns:
 *   { userInfo: { id, name, email, role: { name }, dateInscription }, access_token }
 *
 * Frontend expects:
 *   User { id: string, firstName, lastName, email, role: 'ADMIN'|'TEACHER', createdAt }
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normaliseUser(raw: any): User {
  // Role: might be an object { name } or a plain string
  let role: UserRole = 'TEACHER'
  if (raw.role) {
    const roleName = (typeof raw.role === 'object' ? raw.role.name : raw.role) as string
    role = roleName.toUpperCase() as UserRole
  }

  // Name: might be firstName+lastName or a single 'name' field
  const firstName = raw.firstName ?? (raw.name as string | undefined)?.split(' ')[0] ?? ''
  const lastName =
    raw.lastName ??
    (raw.name as string | undefined)?.split(' ').slice(1).join(' ') ??
    ''

  return {
    id: String(raw.id),
    firstName,
    lastName,
    email: raw.email as string,
    role,
    createdAt: (raw.createdAt ?? raw.dateInscription ?? new Date().toISOString()) as string,
    updatedAt: raw.updatedAt as string | undefined,
  }
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

    const normUser = normaliseUser(rawUser)
    setAuth(jwt, normUser)
    emitAuthChange()
  }, [])

  const register = useCallback(async (formData: RegisterData) => {
    await authApi.register(formData)
  }, [])

  const logout = useCallback(() => {
    clearAuth()
    emitAuthChange()
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
