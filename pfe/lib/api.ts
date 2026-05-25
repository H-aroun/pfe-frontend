import axios from 'axios'
import Cookies from 'js-cookie'
import { clearAuth, normalizeUser } from '@/lib/auth'
import type {
  Activity,
  ActivityType,
  CourseDocument,
  MediaAsset,
  MediaType,
  Question,
  QuestionType,
  Quiz,
  Scenario,
  ScenarioDocument,
  ScenarioModule,
  ScenarioShare,
  ScenarioStatus,
  Sequence,
  SharePermission,
  User,
} from '@/types'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

type RawRecord = Record<string, unknown>

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null
}

function responseMessageFrom(data: unknown): string | undefined {
  if (typeof data === 'string') return data
  if (!isRecord(data)) return undefined

  const message = data.message
  if (typeof message === 'string') return message
  if (Array.isArray(message)) {
    const messages = message.filter((item): item is string => typeof item === 'string')
    return messages.length ? messages.join(' ') : undefined
  }

  return undefined
}

export function getApiErrorMessage(
  error: unknown,
  fallback = 'Request failed. Please try again.',
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Check that the backend is running and try again.'
    }

    if (error.response.status === 401) {
      return 'Invalid email or password.'
    }

    if (error.response.status === 429) {
      return 'Too many attempts. Please wait a moment and try again.'
    }

    return responseMessageFrom(error.response.data) ?? fallback
  }

  return error instanceof Error ? error.message : fallback
}

function asArray(value: unknown): RawRecord[] {
  return Array.isArray(value) ? value.filter(isRecord) : []
}

function stringFrom(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function optionalStringFrom(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function numberFrom(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function optionalNumberFrom(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function idFrom(value: unknown): string {
  return typeof value === 'number' || typeof value === 'string' ? String(value) : ''
}

const statusMap: Record<string, ScenarioStatus> = {
  brouillon: 'BROUILLON',
  en_cours_validation: 'EN_COURS_VALIDATION',
  approuve: 'APPROUVE',
  exporte: 'EXPORTE',
  archive: 'ARCHIVE',
  DRAFT: 'BROUILLON',
  PUBLISHED: 'APPROUVE',
  ARCHIVED: 'ARCHIVE',
}

function normalizeScenarioStatus(value: unknown): ScenarioStatus {
  const status = stringFrom(value)
  return statusMap[status] ?? statusMap[status.toLowerCase()] ?? 'BROUILLON'
}

function scenarioStatusToBackend(status: ScenarioStatus | string): string {
  const map: Record<string, string> = {
    BROUILLON: 'brouillon',
    EN_COURS_VALIDATION: 'en_cours_validation',
    APPROUVE: 'approuve',
    EXPORTE: 'exporte',
    ARCHIVE: 'archive',
  }
  return map[status] ?? status
}

const activityTypeToFrontend: Record<string, ActivityType> = {
  qcm: 'QUIZ',
  vml: 'TEXT',
  exercice: 'TEXT',
  discussion: 'TEXT',
  appartement: 'TEXT',
  VIDEO: 'VIDEO',
  TEXT: 'TEXT',
  QUIZ: 'QUIZ',
  FILE: 'FILE',
  LINK: 'LINK',
}

function activityTypeToBackend(type: string): string {
  const map: Record<string, string> = {
    VIDEO: 'vml',
    TEXT: 'vml',
    QUIZ: 'qcm',
    FILE: 'exercice',
    LINK: 'discussion',
  }
  return map[type] ?? type
}

function questionTypeToFrontend(type: unknown): QuestionType {
  const raw = stringFrom(type)
  if (raw === 'vrai_faux' || raw === 'TRUE_FALSE') return 'TRUE_FALSE'
  return 'MCQ'
}

function questionTypeToBackend(type: QuestionType): string {
  return type === 'TRUE_FALSE' ? 'vrai_faux' : 'qcm'
}

function mediaTypeFrom(raw: RawRecord): MediaType {
  const type = stringFrom(raw.type).toLowerCase()
  const url = stringFrom(raw.url)
  if (type === 'mass' || type === 'image') return 'IMAGE'
  if (type === 'video') return 'VIDEO'
  if (type === 'audio') return 'AUDIO'
  if (type === 'document') return 'DOCUMENT'
  if (/\.(png|jpe?g|gif|webp|svg)$/i.test(url)) return 'IMAGE'
  if (/\.(mp3|wav|ogg|m4a)$/i.test(url)) return 'AUDIO'
  return 'DOCUMENT'
}

function mediaTypeToBackend(file: File): 'mass' | 'video' | 'audio' | 'document' | 'discussion' {
  const name = file.name.toLowerCase()
  if (file.type.startsWith('video/') || /\.(mp4|webm|mov)$/i.test(name)) return 'video'
  if (file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) return 'mass'
  if (file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(name)) return 'audio'
  return 'document'
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

function normalizeUserMutation(data: object): object {
  const raw = data as RawRecord
  return {
    firstName: raw.firstName,
    lastName: raw.lastName,
    email: raw.email,
    password: raw.password,
    role: typeof raw.role === 'string' ? raw.role.toLowerCase() : undefined,
  }
}

function normalizeAnswerList(question: RawRecord): string[] {
  if (Array.isArray(question.options)) {
    return question.options.filter((option): option is string => typeof option === 'string')
  }
  return asArray(question.reponses).map((answer) => stringFrom(answer.texte))
}

function normalizeCorrectAnswer(question: RawRecord): string {
  if (typeof question.correctAnswer === 'string') return question.correctAnswer
  const correct = asArray(question.reponses).find((answer) => answer.estCorrect === true)
  return correct ? stringFrom(correct.texte) : ''
}

function normalizeQuestion(raw: RawRecord): Question {
  return {
    id: idFrom(raw.id),
    text: stringFrom(raw.text ?? raw.titre ?? raw.texte),
    type: questionTypeToFrontend(raw.type),
    options: normalizeAnswerList(raw),
    correctAnswer: normalizeCorrectAnswer(raw),
    points: optionalNumberFrom(raw.points),
  }
}

function normalizeQuizResponse(data: unknown): Quiz | null {
  if (!isRecord(data)) return null
  return {
    id: idFrom(data.id),
    title: stringFrom(data.title ?? data.titre, 'Quiz'),
    questions: asArray(data.questions).map(normalizeQuestion),
    passingScore: numberFrom(data.passingScore ?? data.scorePourReussir, 70),
    attempts: optionalNumberFrom(data.tentatives),
    activityId: isRecord(data.activite) ? idFrom(data.activite.id) : undefined,
  }
}

function normalizeActivity(raw: RawRecord): Activity {
  return {
    id: idFrom(raw.id),
    title: stringFrom(raw.title ?? raw.titre, 'Untitled activity'),
    type: activityTypeToFrontend[stringFrom(raw.type)] ?? 'TEXT',
    content: optionalStringFrom(raw.content ?? raw.consigne),
    mediaUrl: optionalStringFrom(raw.mediaUrl ?? raw.url),
    duration: optionalNumberFrom(raw.duration ?? raw.duree),
    points: optionalNumberFrom(raw.points),
    order: numberFrom(raw.order ?? raw.ordre),
    quiz: normalizeQuizResponse(raw.quiz) ?? undefined,
  }
}

function normalizeSequence(raw: RawRecord): Sequence {
  return {
    id: idFrom(raw.id),
    title: stringFrom(raw.title ?? raw.titre, 'Untitled sequence'),
    description: optionalStringFrom(raw.description ?? raw.texte),
    order: numberFrom(raw.order ?? raw.ordre),
    activities: asArray(raw.activities ?? raw.activites).map(normalizeActivity),
  }
}

function normalizeModule(raw: RawRecord): ScenarioModule {
  return {
    id: idFrom(raw.id),
    title: stringFrom(raw.title ?? raw.titre, 'Untitled module'),
    description: optionalStringFrom(raw.description),
    order: numberFrom(raw.order ?? raw.ordre),
    sequences: asArray(raw.sequences).map(normalizeSequence),
  }
}

function normalizeScenario(raw: RawRecord): Scenario {
  const status = normalizeScenarioStatus(raw.status ?? raw.statut)
  const createdAt = stringFrom(raw.createdAt ?? raw.dateCreation, new Date().toISOString())
  const title = stringFrom(raw.title ?? raw.titre, 'Untitled scenario')

  return {
    id: idFrom(raw.id),
    title,
    titre: title,
    description: optionalStringFrom(raw.description),
    objectif: optionalStringFrom(raw.objectif),
    niveau: optionalStringFrom(raw.niveau),
    dureeScenario: optionalNumberFrom(raw.dureeScenario),
    courseDocument: isRecord(raw.courseDocument) ? raw.courseDocument as unknown as CourseDocument : undefined,
    courseDocumentVersion: optionalNumberFrom(raw.courseDocumentVersion),
    scenarioDocument: isRecord(raw.scenarioDocument) ? raw.scenarioDocument as unknown as ScenarioDocument : undefined,
    scenarioDocumentVersion: optionalNumberFrom(raw.scenarioDocumentVersion),
    status,
    statut: scenarioStatusToBackend(status),
    template: 'BLANK',
    isPublic: raw.isPublic === true,
    author: isRecord(raw.author)
      ? normalizeUser(raw.author as Parameters<typeof normalizeUser>[0])
      : isRecord(raw.user)
        ? normalizeUser(raw.user as Parameters<typeof normalizeUser>[0])
        : undefined,
    modules: asArray(raw.modules).map(normalizeModule),
    shares: asArray(raw.shares).map(normalizeShare),
    createdAt,
    dateCreation: createdAt,
    updatedAt: stringFrom(raw.updatedAt, createdAt),
  }
}

function normalizeScenarioResponse(data: unknown): Scenario | unknown {
  return isRecord(data) ? normalizeScenario(data) : data
}

function normalizeScenarioList(data: unknown): Scenario[] {
  const source = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.data)
      ? data.data
      : []
  return source.filter(isRecord).map(normalizeScenario)
}

function normalizeMediaAsset(raw: RawRecord): MediaAsset {
  const type = mediaTypeFrom(raw)
  const title = stringFrom(raw.originalName ?? raw.filename ?? raw.titre, 'Untitled file')
  const createdAt = stringFrom(raw.createdAt, new Date().toISOString())

  return {
    id: idFrom(raw.id),
    filename: title,
    originalName: title,
    mimetype: stringFrom(raw.mimetype),
    size: numberFrom(raw.size ?? raw.taille),
    url: stringFrom(raw.url),
    type,
    tags: Array.isArray(raw.tags) ? raw.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    createdAt,
  }
}

function normalizeMediaList(data: unknown): MediaAsset[] {
  const source = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.data)
      ? data.data
      : []
  return source.filter(isRecord).map(normalizeMediaAsset)
}

function normalizeShare(raw: RawRecord): ScenarioShare {
  const userSource = isRecord(raw.user)
    ? raw.user
    : isRecord(raw.sharedWith)
      ? raw.sharedWith
      : {}
  const permission = stringFrom(raw.permission).toLowerCase() === 'edit' ? 'EDIT' : 'READ'

  return {
    id: idFrom(raw.id),
    user: normalizeUser(userSource as Parameters<typeof normalizeUser>[0]),
    permission,
    createdAt: stringFrom(raw.createdAt ?? raw.sharedAt, new Date().toISOString()),
  }
}

function normalizeShareList(data: unknown): ScenarioShare[] {
  const source = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.data)
      ? data.data
      : []
  return source.filter(isRecord).map(normalizeShare)
}

function normalizeScenarioMutation(data: object): object {
  const raw = data as RawRecord
  return {
    ...data,
    titre: raw.titre ?? raw.title,
    statut:
      typeof raw.status === 'string'
        ? scenarioStatusToBackend(raw.status)
        : raw.statut,
    title: undefined,
    status: undefined,
  }
}

function normalizeModuleMutation(data: object, scenarioId?: string): object {
  const raw = data as RawRecord
  return {
    ...data,
    titre: raw.titre ?? raw.title,
    ordre: raw.ordre ?? raw.order,
    scenarioId: scenarioId ? Number(scenarioId) : raw.scenarioId,
    title: undefined,
    order: undefined,
  }
}

function normalizeSequenceMutation(data: object, moduleId?: string): object {
  const raw = data as RawRecord
  return {
    ...data,
    titre: raw.titre ?? raw.title,
    ordre: raw.ordre ?? raw.order,
    moduleId: moduleId ? Number(moduleId) : raw.moduleId,
    title: undefined,
    order: undefined,
  }
}

function normalizeActivityMutation(data: object, sequenceId?: string): object {
  const raw = data as RawRecord
  return {
    ...data,
    titre: raw.titre ?? raw.title,
    type: typeof raw.type === 'string' ? activityTypeToBackend(raw.type) : raw.type,
    consigne: raw.consigne ?? raw.content,
    ordre: raw.ordre ?? raw.order,
    sequenceId: sequenceId ? Number(sequenceId) : raw.sequenceId,
    title: undefined,
    content: undefined,
    order: undefined,
  }
}

function normalizeReorderItems(ids: string[]): { id: number; ordre: number }[] {
  return ids.map((id, ordre) => ({ id: Number(id), ordre }))
}

function normalizeQuizMutation(activityId: string, data: object): object {
  const raw = data as RawRecord
  return {
    titre: stringFrom(raw.title ?? raw.titre, 'Quiz'),
    description: optionalStringFrom(raw.description),
    tentatives: optionalNumberFrom(raw.attempts ?? raw.tentatives),
    scorePourReussir: numberFrom(raw.passingScore ?? raw.scorePourReussir, 70),
    activiteId: Number(activityId),
  }
}

// Attach JWT to every request
api.interceptors.request.use((config) => {
  const token = Cookies.get('edu_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete?.('Content-Type')
    config.headers.delete?.('content-type')
    delete config.headers['Content-Type']
    delete config.headers['content-type']
  }
  return config
})

// Handle 401 by clearing the local session.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url ?? '')
      const requestMethod = String(error.config?.method ?? '').toUpperCase()
      const isLoginAttempt = requestUrl.includes('/auth/login')
      const isPublicRegistration = requestMethod === 'POST' && requestUrl === '/users'

      if (!isLoginAttempt && !isPublicRegistration) {
        clearAuth()
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data).then((response) => {
      response.data.userInfo = normalizeUserResponse(response.data.userInfo ?? response.data.user)
      return response
    }),
  register: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
  }) => api.post('/users', data).then((response) => {
    response.data = normalizeUserResponse(response.data)
    return response
  }),
  me: () => api.get('/users/me').then((response) => {
    response.data = normalizeUserResponse(response.data)
    return response
  }),
}

export const usersApi = {
  getAll: () => api.get('/users').then((response) => {
    response.data = normalizeUserList(response.data)
    return response
  }),
  create: (data: {
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
  }) => api.post('/users/managed', normalizeUserMutation(data)).then((response) => {
    response.data = normalizeUserResponse(response.data)
    return response
  }),
  getMe: () => api.get('/users/me').then((response) => {
    response.data = normalizeUserResponse(response.data)
    return response
  }),
  updateMe: (data: Partial<{ firstName: string; lastName: string; email: string; password?: string }>) =>
    api.put('/users/me', data).then((response) => {
      response.data = normalizeUserResponse(response.data)
      return response
    }),
  update: (id: string, data: Partial<{
    firstName: string
    lastName: string
    email: string
    password: string
    role: string
  }>) => api.put(`/users/${id}`, normalizeUserMutation(data)).then((response) => {
    response.data = normalizeUserResponse(response.data)
    return response
  }),
  updateRole: (id: string, role: string) =>
    api.put(`/users/${id}/role`, { role: role.toLowerCase() }).then((response) => {
      response.data = normalizeUserResponse(response.data)
      return response
    }),
  delete: (id: string) => api.delete(`/users/${id}`),
}

export const scenariosApi = {
  getAll: (params?: { status?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/scenarios/my', {
      params: {
        ...params,
        status: params?.status ? scenarioStatusToBackend(params.status) : undefined,
      },
    }).then((response) => {
      response.data = normalizeScenarioList(response.data)
      return response
    }),
  getAllAdmin: () => api.get('/scenarios').then((response) => {
    response.data = normalizeScenarioList(response.data)
    return response
  }),
  getOne: (id: string) => api.get(`/scenarios/${id}`).then((response) => {
    response.data = normalizeScenarioResponse(response.data)
    return response
  }),
  create: (data: { title?: string; titre?: string; description?: string; objectif?: string; niveau?: string; dureeScenario?: number; template?: string; isPublic?: boolean; courseDocument?: CourseDocument; scenarioDocument?: ScenarioDocument }) =>
    api.post('/scenarios', normalizeScenarioMutation(data)).then((response) => {
      response.data = normalizeScenarioResponse(response.data)
      return response
    }),
  update: (id: string, data: object) => api.put(`/scenarios/${id}`, normalizeScenarioMutation(data)).then((response) => {
    response.data = normalizeScenarioResponse(response.data)
    return response
  }),
  getCourseDocument: (id: string) => api.get(`/scenarios/${id}/course-document`).then((response) => {
    response.data = response.data as CourseDocument
    return response
  }),
  updateCourseDocument: (id: string, courseDocument: CourseDocument) =>
    api.put(`/scenarios/${id}/course-document`, { courseDocument }).then((response) => {
      response.data = response.data as CourseDocument
      return response
    }),

  getScenarioDocument: (id: string) => api.get(`/scenarios/${id}/scenario-document`).then((response) => {
    response.data = response.data as ScenarioDocument
    return response
  }),
  updateScenarioDocument: (id: string, scenarioDocument: ScenarioDocument) =>
    api.put(`/scenarios/${id}/scenario-document`, { scenarioDocument }).then((response) => {
      response.data = response.data as ScenarioDocument
      return response
    }),

  submit:   (id: string) => api.patch(`/scenarios/${id}/submit`),
  approve:  (id: string) => api.patch(`/scenarios/${id}/approve`),
  reject:   (id: string) => api.patch(`/scenarios/${id}/reject`),
  markExported: (id: string) => api.patch(`/scenarios/${id}/export`),
  archive:  (id: string) => api.patch(`/scenarios/${id}/archive`),
  duplicate:(id: string) => api.post(`/scenarios/${id}/duplicate`),
  delete:   (id: string) => api.delete(`/scenarios/${id}`),

  createModule: (scenarioId: string, data: object) =>
    api.post('/modules', normalizeModuleMutation(data, scenarioId)),
  updateModule: (_scenarioId: string, moduleId: string, data: object) =>
    api.put(`/modules/${moduleId}`, normalizeModuleMutation(data)),
  reorderModules: (scenarioId: string, moduleIds: string[]) =>
    api.patch(`/modules/scenario/${scenarioId}/reorder`, {
      items: normalizeReorderItems(moduleIds),
    }),
  deleteModule: (_scenarioId: string, moduleId: string) =>
    api.delete(`/modules/${moduleId}`),

  createSequence: (_scenarioId: string, moduleId: string, data: object) =>
    api.post('/sequences', normalizeSequenceMutation(data, moduleId)),
  updateSequence: (_scenarioId: string, _moduleId: string, seqId: string, data: object) =>
    api.put(`/sequences/${seqId}`, normalizeSequenceMutation(data)),
  reorderSequences: (_scenarioId: string, moduleId: string, sequenceIds: string[]) =>
    api.patch(`/sequences/module/${moduleId}/reorder`, {
      items: normalizeReorderItems(sequenceIds),
    }),
  deleteSequence: (_scenarioId: string, _moduleId: string, seqId: string) =>
    api.delete(`/sequences/${seqId}`),

  createActivity: (_scenarioId: string, _moduleId: string, seqId: string, data: object) =>
    api.post('/activites', normalizeActivityMutation(data, seqId)),
  updateActivity: (_scenarioId: string, _moduleId: string, _seqId: string, actId: string, data: object) =>
    api.put(`/activites/${actId}`, normalizeActivityMutation(data)),
  reorderActivities: (_scenarioId: string, _moduleId: string, seqId: string, activityIds: string[]) =>
    api.patch(`/activites/sequence/${seqId}/reorder`, {
      items: normalizeReorderItems(activityIds),
    }),
  deleteActivity: (_scenarioId: string, _moduleId: string, _seqId: string, actId: string) =>
    api.delete(`/activites/${actId}`),

  getShares: (id: string) => api.get(`/scenario-shares/scenario/${id}`).then((response) => {
    response.data = normalizeShareList(response.data)
    return response
  }),
  share: (id: string, data: { userId: string; permission: SharePermission }) =>
    api.post('/scenario-shares', {
      scenarioId: Number(id),
      sharedWithId: Number(data.userId),
      permission: data.permission === 'EDIT' ? 'edit' : 'view',
    }),
  revokeShare: (_id: string, shareId: string) =>
    api.delete(`/scenario-shares/${shareId}`),
}

export const mediaApi = {
  getAll: (params?: { type?: string; search?: string; page?: number; limit?: number }) =>
    api.get('/ressources', { params }).then((response) => {
      response.data = normalizeMediaList(response.data)
      return response
    }),
  upload: async (fileOrFormData: File | FormData) => {
    const file = fileOrFormData instanceof FormData
      ? fileOrFormData.get('file')
      : fileOrFormData

    if (!(file instanceof File)) {
      throw new Error('No file selected')
    }

    const resource = await api.post('/ressources', {
      titre: file.name,
      type: mediaTypeToBackend(file),
      taille: file.size,
    })

    const resourceId = idFrom(resource.data?.id)
    const formData = new FormData()
    formData.append('file', file)

    return api
      .post(`/media/upload/ressource/${resourceId}`, formData)
      .then((response) => {
        response.data = normalizeMediaAsset(response.data)
        return response
      })
  },
  updateTags: (id: string, tags: string[]) => {
    void id
    void tags
    return Promise.reject(new Error('Resource tags are not supported by the backend yet'))
  },
  delete: (id: string) => api.delete(`/ressources/${id}`),
}

export const quizApi = {
  getByActivity: (activityId: string) =>
    api.get(`/quiz/activite/${activityId}`).then((response) => {
      response.data = normalizeQuizResponse(response.data)
      return response
    }),
  create: (activityId: string, data: object) =>
    api.post('/quiz', normalizeQuizMutation(activityId, data)).then((response) => {
      response.data = normalizeQuizResponse(response.data)
      return response
    }),
  update: (quizId: string, data: object) =>
    api.put(`/quiz/${quizId}`, normalizeQuizMutation('', data)).then((response) => {
      response.data = normalizeQuizResponse(response.data)
      return response
    }),
  delete: (quizId: string) => api.delete(`/quiz/${quizId}`),
  questionTypeToBackend,
}

export const analyticsApi = {
  getDashboard: () => api.get('/rapports/analytics/dashboard'),
  getScenarioStats: (id: string) => api.get(`/rapports/analytics/scenario/${id}`),
  getUserActivity: (userId: string) => api.get(`/rapports/analytics/user/${userId}`),
  getMyStats: () => api.get('/rapports/analytics/me'),
}

export const rapportApi = {
  getAll: () => api.get('/rapports'),
  getMine: () => api.get('/rapports/my'),
}

export const scormApi = {
  export: (scenarioId: string) =>
    api.get(`/scorm/${scenarioId}/export/scorm`, { responseType: 'blob' }),
}

export default api
