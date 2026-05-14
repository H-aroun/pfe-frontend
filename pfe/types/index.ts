// ─── Users ──────────────────────────────────────────────────────────────────

export type UserRole = 'TEACHER' | 'ADMIN'

export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt?: string
}

export interface AuthResponse {
  accessToken: string
  user: User
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

export type ScenarioStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
export type ScenarioTemplate = 'BLANK' | 'COURSE' | 'ASSESSMENT' | 'TUTORIAL'
export type ActivityType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'FILE' | 'LINK'

export interface Scenario {
  id: string
  // Backend uses 'titre', frontend displays as 'title' — accept both
  title: string
  titre?: string
  description?: string
  // Backend uses 'statut', frontend uses 'status' — accept both
  status: ScenarioStatus
  statut?: string
  template: ScenarioTemplate
  isPublic: boolean
  author: User
  modules: ScenarioModule[]
  shares?: ScenarioShare[]
  createdAt: string
  dateCreation?: string
  updatedAt: string
}

export interface ScenarioModule {
  id: string
  title: string
  description?: string
  order: number
  sequences: Sequence[]
}

export interface Sequence {
  id: string
  title: string
  description?: string
  order: number
  activities: Activity[]
}

export interface Activity {
  id: string
  title: string
  type: ActivityType
  content?: string
  mediaUrl?: string
  duration?: number
  points?: number
  order: number
  quiz?: Quiz
}

// ─── Quiz ─────────────────────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'TRUE_FALSE'

export interface Question {
  id: string
  text: string
  type: QuestionType
  options: string[]
  correctAnswer: string | string[]
  points?: number
}

export interface Quiz {
  id: string
  questions: Question[]
  passingScore: number
  timeLimit?: number
  activityId?: string
}

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'

export interface MediaAsset {
  id: string
  filename: string
  originalName: string
  mimetype: string
  size: number
  url: string
  type: MediaType
  tags: string[]
  uploadedBy?: User
  createdAt: string
}

// ─── Sharing ─────────────────────────────────────────────────────────────────

export type SharePermission = 'READ' | 'EDIT'

export interface ScenarioShare {
  id: string
  user: User
  permission: SharePermission
  createdAt: string
}

// ─── Analytics ───────────────────────────────────────────────────────────────

export interface ActivityPoint {
  date: string
  count: number
  completions?: number
}

export interface ScenarioStat {
  id: string
  title: string
  completions: number
  avgScore: number
  avgTime?: number
  status: ScenarioStatus
}

export interface AnalyticsDashboard {
  totalScenarios: number
  publishedScenarios: number
  draftScenarios: number
  archivedScenarios: number
  totalUsers?: number
  avgCompletionRate: number
  totalAttempts: number
  avgScore: number
  recentActivity?: ActivityPoint[]
  topScenarios?: ScenarioStat[]
}

export interface ScenarioAnalytics {
  scenarioId: string
  title: string
  totalAttempts: number
  completions: number
  completionRate: number
  avgScore: number
  avgDuration?: number
  activityBreakdown?: ActivityStat[]
}

export interface ActivityStat {
  activityId: string
  title: string
  avgScore: number
  attempts: number
}

// ─── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateScenarioDto {
  title: string
  description?: string
  template?: ScenarioTemplate
  isPublic?: boolean
}

export interface CreateModuleDto {
  title: string
  description?: string
}

export interface CreateSequenceDto {
  title: string
  description?: string
}

export interface CreateActivityDto {
  title: string
  type: ActivityType
  content?: string
  mediaUrl?: string
  duration?: number
  points?: number
}

export interface CreateQuizDto {
  questions: Omit<Question, 'id'>[]
  passingScore: number
  timeLimit?: number
}

export interface ShareScenarioDto {
  userId: string
  permission: SharePermission
}

// ─── API Wrappers ─────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

export interface ApiError {
  message: string
  statusCode: number
  error?: string
}
