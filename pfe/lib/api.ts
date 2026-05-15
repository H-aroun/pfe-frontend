import axios from 'axios'
import Cookies from 'js-cookie'
import { normalizeUser } from '@/lib/auth'
import type { User } from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function normalizeUserList(data: unknown): User[] {
  const source = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.data)
      ? data.data
      : []

  return source
    .filter(isRecord)
    .map((user) => normalizeUser(user as Parameters<typeof normalizeUser>[0]))
}

function normalizeUserResponse(data: unknown): User | unknown {
  if (!isRecord(data)) return data
  return normalizeUser(data as Parameters<typeof normalizeUser>[0])
}

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('edu_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 — clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('edu_token')
      Cookies.remove('edu_user')
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/login'
      }
    }
    return Promise.reject(error)
  }
)

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Backend: POST /auth/login  → { userInfo, access_token }
// Backend: POST /auth/register → { name, email, password }
export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  register: (data: {
    name: string
    email: string
    password: string
  }) => api.post('/auth/register', data),
  me: () => api.get('/users/me').then((response) => {
    response.data = normalizeUserResponse(response.data)
    return response
  }),
}

// ─── Users ────────────────────────────────────────────────────────────────────
// Backend: GET /users (admin), GET /users/:id, DELETE /users/:id
export const usersApi = {
  getAll: () => api.get('/users').then((response) => {
    response.data = normalizeUserList(response.data)
    return response
  }),
  getMe: () => api.get('/users/me').then((response) => {
    response.data = normalizeUserResponse(response.data)
    return response
  }),
  updateMe: (data: Partial<{ firstName: string; lastName: string; email: string }>) =>
    api.put('/users/me', data),
  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/users/${id}`),
}

// ─── Scenarios ────────────────────────────────────────────────────────────────
// Backend: GET /scenarios (admin all) | GET /scenarios/my (current user)
export const scenariosApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/scenarios/my', { params }),   // teachers get their own scenarios
  getAllAdmin: () => api.get('/scenarios'), // admin only
  getOne: (id: string) => api.get(`/scenarios/${id}`),
  create: (data: { title?: string; titre?: string; description?: string; objectif?: string; niveau?: string; dureeScenario?: number; template?: string; isPublic?: boolean }) =>
    api.post('/scenarios', {
      titre: data.titre ?? data.title,
      description: data.description,
      objectif: data.objectif,
      niveau: data.niveau,
      dureeScenario: data.dureeScenario,
    }),
  update: (id: string, data: object) => api.put(`/scenarios/${id}`, data),

  // Lifecycle actions
  submit:   (id: string) => api.patch(`/scenarios/${id}/submit`),
  approve:  (id: string) => api.patch(`/scenarios/${id}/approve`),
  reject:   (id: string) => api.patch(`/scenarios/${id}/reject`),
  finalize: (id: string) => api.patch(`/scenarios/${id}/finalize`),
  archive:  (id: string) => api.patch(`/scenarios/${id}/archive`),
  duplicate:(id: string) => api.post(`/scenarios/${id}/duplicate`),
  delete:   (id: string) => api.delete(`/scenarios/${id}`),

  // Kept for compatibility — map to lifecycle endpoints
  publish: (id: string) => api.patch(`/scenarios/${id}/finalize`),

  // Modules (via course-module controller)
  createModule: (scenarioId: string, data: object) =>
    api.post('/course-modules', { ...data, scenarioId }),
  updateModule: (_scenarioId: string, moduleId: string, data: object) =>
    api.put(`/course-modules/${moduleId}`, data),
  deleteModule: (_scenarioId: string, moduleId: string) =>
    api.delete(`/course-modules/${moduleId}`),

  // Sequences
  createSequence: (_scenarioId: string, moduleId: string, data: object) =>
    api.post('/sequences', { ...data, moduleId }),
  updateSequence: (_scenarioId: string, _moduleId: string, seqId: string, data: object) =>
    api.put(`/sequences/${seqId}`, data),
  deleteSequence: (_scenarioId: string, _moduleId: string, seqId: string) =>
    api.delete(`/sequences/${seqId}`),

  // Activities
  createActivity: (_scenarioId: string, _moduleId: string, seqId: string, data: object) =>
    api.post('/activites', { ...data, sequenceId: seqId }),
  updateActivity: (_scenarioId: string, _moduleId: string, _seqId: string, actId: string, data: object) =>
    api.put(`/activites/${actId}`, data),
  deleteActivity: (_scenarioId: string, _moduleId: string, _seqId: string, actId: string) =>
    api.delete(`/activites/${actId}`),

  // Sharing
  getShares: (id: string) => api.get(`/scenario-shares/scenario/${id}`),
  share: (id: string, data: { userId: string; permission: string }) =>
    api.post('/scenario-shares', { scenarioId: id, ...data }),
  revokeShare: (_id: string, shareId: string) =>
    api.delete(`/scenario-shares/${shareId}`),
}

// ─── Media / Ressources ───────────────────────────────────────────────────────
// Backend: /ressources
export const mediaApi = {
  getAll: (params?: { type?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/ressources', { params }),
  upload: (formData: FormData) =>
    api.post('/ressources/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  updateTags: (id: string, tags: string[]) =>
    api.patch(`/ressources/${id}/tags`, { tags }),
  delete: (id: string) => api.delete(`/ressources/${id}`),
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────
// Backend: /quizzes
export const quizApi = {
  getByActivity: (activityId: string) => api.get(`/quizzes/activite/${activityId}`),
  create: (activityId: string, data: object) => api.post('/quizzes', { ...data, activityId }),
  update: (quizId: string, data: object) => api.put(`/quizzes/${quizId}`, data),
  delete: (quizId: string) => api.delete(`/quizzes/${quizId}`),
}

// ─── Analytics / Rapport ──────────────────────────────────────────────────────
// Backend: /rapports/analytics/dashboard  (admin), /rapports/analytics/global
export const analyticsApi = {
  getDashboard: () => api.get('/rapports/analytics/dashboard'),
  getScenarioStats: (id: string) => api.get(`/rapports/analytics/scenario/${id}`),
  getUserActivity: (userId: string) => api.get(`/rapports/analytics/user/${userId}`),
  getMyStats: () => api.get('/rapports/analytics/me'),
}

// ─── Rapport ─────────────────────────────────────────────────────────────────
export const rapportApi = {
  getAll: () => api.get('/rapports'),
  getMine: () => api.get('/rapports/my'),
}

// ─── SCORM ────────────────────────────────────────────────────────────────────
// Backend: /scorm/:id/export
export const scormApi = {
  export: (scenarioId: string) =>
    api.get(`/scorm/${scenarioId}/export`, { responseType: 'blob' }),
}

export default api
