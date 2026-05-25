import Cookies from 'js-cookie'
import type { User, UserRole } from '@/types'

const TOKEN_KEY = 'edu_token'
const USER_KEY = 'edu_user'
export const AUTH_CHANGED_EVENT = 'edu-auth-change'

function notifyAuthChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT))
  }
}

export function setAuth(token: string, user: User) {
  Cookies.set(TOKEN_KEY, token, { expires: 1, sameSite: 'strict' })
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1, sameSite: 'strict' })
  notifyAuthChanged()
}

export function setStoredUser(user: User) {
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 1, sameSite: 'strict' })
  notifyAuthChanged()
}

export function normalizeUser(raw: {
  id: string | number
  email: string
  role?: string | { name?: string }
  firstName?: string
  lastName?: string
  name?: string
  createdAt?: string
  dateInscription?: string
  updatedAt?: string
}): User {
  let role: UserRole = 'TEACHER'

  if (raw.role) {
    const roleName = typeof raw.role === 'object' ? raw.role.name : raw.role
    const normalizedRole = roleName?.toUpperCase()
    if (normalizedRole === 'ADMIN' || normalizedRole === 'TEACHER') {
      role = normalizedRole
    }
  }

  const nameParts = raw.name?.trim().split(/\s+/) ?? []
  const firstName = raw.firstName ?? nameParts[0] ?? ''
  const lastName = raw.lastName ?? nameParts.slice(1).join(' ')

  return {
    id: String(raw.id),
    firstName,
    lastName,
    email: raw.email,
    role,
    createdAt: raw.createdAt ?? raw.dateInscription ?? new Date().toISOString(),
    updatedAt: raw.updatedAt,
  }
}

export function clearAuth() {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(USER_KEY)
  notifyAuthChanged()
}

export function getToken(): string | null {
  return Cookies.get(TOKEN_KEY) ?? null
}

export function getStoredUser(): User | null {
  const raw = Cookies.get(USER_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) as User }
  catch { return null }
}

export function isAuthenticated(): boolean {
  return !!getToken()
}
