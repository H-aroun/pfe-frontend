import Cookies from 'js-cookie'
import type { User } from '@/types'

const TOKEN_KEY = 'edu_token'
const USER_KEY = 'edu_user'

export function setAuth(token: string, user: User) {
  Cookies.set(TOKEN_KEY, token, { expires: 7, sameSite: 'strict' })
  Cookies.set(USER_KEY, JSON.stringify(user), { expires: 7, sameSite: 'strict' })
}

export function clearAuth() {
  Cookies.remove(TOKEN_KEY)
  Cookies.remove(USER_KEY)
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
