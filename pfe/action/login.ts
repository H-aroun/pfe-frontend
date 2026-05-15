import { normalizeUser, setAuth } from '@/lib/auth'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface LoginResponse {
  access_token?: string
  accessToken?: string
  userInfo?: {
    id: string | number
    email: string
    role?: string | { name?: string }
    firstName?: string
    lastName?: string
    name?: string
    createdAt?: string
    dateInscription?: string
    updatedAt?: string
  }
  user?: {
    id: string | number
    email: string
    role?: string | { name?: string }
    firstName?: string
    lastName?: string
    name?: string
    createdAt?: string
    dateInscription?: string
    updatedAt?: string
  }
}

export async function login(email: string, password: string) {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  if (!response.ok) {
    throw new Error('Login failed')
  }

  const data = (await response.json()) as LoginResponse
  const rawUser = data.userInfo ?? data.user
  const token = data.access_token ?? data.accessToken

  if (!rawUser || !token) {
    throw new Error('Invalid response from server: missing user or token')
  }

  setAuth(token, normalizeUser(rawUser))

  return data
}
