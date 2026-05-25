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
  accessToken?: string
  access_token?: string
  user: User
  userInfo?: User
}

// ─── Scenarios ───────────────────────────────────────────────────────────────

export type ScenarioStatus = 'BROUILLON' | 'EN_COURS_VALIDATION' | 'APPROUVE' | 'EXPORTE' | 'ARCHIVE'
export type ScenarioTemplate = 'BLANK' | 'COURSE' | 'ASSESSMENT' | 'TUTORIAL'
export type ActivityType = 'VIDEO' | 'TEXT' | 'QUIZ' | 'FILE' | 'LINK'
export type CoursePageType = 'lesson' | 'branching_scenario' | 'quiz' | 'media'
export type CourseLessonType = 'lesson' | 'quiz'
export type CourseBlockCategory =
  | 'text'
  | 'text_narrative'
  | 'statement'
  | 'list'
  | 'media'
  | 'dialogue_characters'
  | 'interactive'
  | 'interactive_engagement'
  | 'knowledge_check'
  | 'questions'
  | 'branching_decision'
  | 'data_reference'
  | 'navigation_completion'
  | 'chart'
  | 'divider'
export type CourseBlockType =
  | 'text'
  | 'heading'
  | 'paragraph'
  | 'callout'
  | 'statement'
  | 'quote'
  | 'list'
  | 'numbered_list'
  | 'image'
  | 'gallery'
  | 'image_gallery'
  | 'audio'
  | 'video'
  | 'embed'
  | 'attachment'
  | 'document'
  | 'code'
  | 'dialogue'
  | 'character_monologue'
  | 'branching_dialogue'
  | 'multiple_choice'
  | 'multiple_select'
  | 'true_false'
  | 'fill_blank'
  | 'matching'
  | 'ordering'
  | 'hotspot'
  | 'short_answer'
  | 'likert'
  | 'rating_slider'
  | 'choice_point'
  | 'consequence'
  | 'decision_recap'
  | 'branch_merge'
  | 'conditional_gate'
  | 'accordion'
  | 'tabs'
  | 'process'
  | 'process_steps'
  | 'timeline'
  | 'flashcards'
  | 'checklist'
  | 'reveal'
  | 'sorting'
  | 'sorting_activity'
  | 'before_after'
  | 'labeled_graphic'
  | 'scenario'
  | 'table'
  | 'resource_link'
  | 'file_download'
  | 'glossary'
  | 'button'
  | 'continue_button'
  | 'lesson_summary'
  | 'score_summary'
  | 'certificate'
  | 'completion_message'
  | 'restart_button'
  | 'divider'
  | 'spacer'
  | 'knowledge_check'
  | 'chart'

export type CourseKnowledgeCheckType = 'multiple_choice' | 'multiple_response' | 'fill_blank' | 'matching'
export type CourseQuizQuestionType = CourseKnowledgeCheckType | 'true_false'

export interface CourseInteractionItem {
  id: string
  title: string
  content?: string
  mediaUrl?: string
  marker?: { x: number; y: number }
  match?: string
}

export interface CourseKnowledgeCheckOption {
  id: string
  text: string
  isCorrect: boolean
  feedback?: string
  match?: string
}

export interface CourseKnowledgeCheck {
  type: CourseKnowledgeCheckType
  question: string
  options: CourseKnowledgeCheckOption[]
  correctFeedback?: string
  incorrectFeedback?: string
  allowRetry?: boolean
}

export interface CourseBlock {
  id: string
  type: CourseBlockType
  category?: CourseBlockCategory
  title?: string
  content?: string
  assetUrl?: string
  items?: CourseInteractionItem[]
  knowledgeCheck?: CourseKnowledgeCheck
  metadata?: Record<string, unknown>
}

export interface BranchingChoice {
  id: string
  text: string
  nextNodeId?: string
  score?: number
  feedback?: string
}

export interface BranchingNode {
  id: string
  speaker?: string
  text: string
  emotion?: string
  position?: { x: number; y: number }
  choices: BranchingChoice[]
}

export interface CourseQuizQuestionOption {
  id: string
  text: string
  isCorrect: boolean
  feedback?: string
  match?: string
}

export interface CourseQuizQuestion {
  id: string
  type: CourseQuizQuestionType | 'mcq'
  text: string
  points: number
  options: CourseQuizQuestionOption[]
  feedback?: string
}

export interface CourseLesson {
  id: string
  type: CourseLessonType
  title: string
  summary?: string
  estimatedMinutes?: number
  coverImageUrl?: string
  blocks: CourseBlock[]
  quiz?: {
    passingScore: number
    timeLimitMinutes?: number
    attempts?: number
    randomizeQuestions?: boolean
    randomizeAnswers?: boolean
    showFeedback?: boolean
    questions: CourseQuizQuestion[]
  }
  metadata?: Record<string, unknown>
}

export interface CourseSection {
  id: string
  title: string
  lessonIds: string[]
  collapsed?: boolean
}

export interface CourseTheme {
  accentColor: string
  fontPairing: 'modern' | 'classic' | 'serif' | 'friendly'
  coverLayout: 'centered' | 'split' | 'compact'
  navigationMode: 'sidebar' | 'compact' | 'continuous'
  lessonNumbers: boolean
  sidebarEnabled: boolean
  logoUrl?: string
  coverImageUrl?: string
}

export interface CoursePublishSettings {
  target: 'lms' | 'web' | 'pdf'
  lmsStandard: 'scorm_1_2' | 'scorm_2004' | 'xapi' | 'cmi5' | 'aicc'
  tracking: 'completion' | 'quiz_score' | 'completion_and_score'
  completionPercentage: number
  passingScore: number
  reportingStatus: 'completed_passed' | 'completed_failed' | 'passed_failed'
}

export interface CoursePage {
  id: string
  type: CoursePageType
  title: string
  summary?: string
  blocks?: CourseBlock[]
  scenario?: {
    startNodeId: string
    nodes: BranchingNode[]
    passingScore?: number
  }
  quiz?: {
    passingScore: number
    questions: CourseQuizQuestion[]
  }
  metadata?: Record<string, unknown>
}

export interface CourseDocument {
  schemaVersion: 1
  id: string
  title: string
  description?: string
  objectives: string[]
  estimatedMinutes?: number
  sections?: CourseSection[]
  lessons?: CourseLesson[]
  pages: CoursePage[]
  settings: {
    completionMode: 'pages' | 'score'
    passingScore: number
    scormVersion: '1.2' | '2004'
    completionPercentage?: number
    requireQuizPass?: boolean
  }
  theme?: CourseTheme
  publish?: CoursePublishSettings
  metadata?: {
    source?: 'legacy_tree' | 'course_engine' | 'ai_draft'
    generatedAt?: string
    version?: number
    updatedAt?: string
    authorName?: string
    audience?: string
    duration?: string
    format?: 'Linear' | 'Branching' | 'Hybrid' | 'Assessment-Only' | string
    tone?: string
    scorm?: Record<string, unknown>
  }
}

export type ScenarioNodeType =
  | 'start'
  | 'dialogue'
  | 'choice'
  | 'feedback'
  | 'information'
  | 'decision'
  | 'score'
  | 'ending'
  | 'media'
  | 'variable'
  | 'conditional_branch'

export interface ScenarioSpeaker {
  name: string
  role?: string
  avatarUrl?: string
}

export interface ScenarioContent {
  title?: string
  body?: string
  tone?: 'neutral' | 'friendly' | 'concerned' | 'confident' | 'urgent'
  narration?: {
    enabled: boolean
    voice?: string
  }
}

export interface ScenarioMedia {
  id: string
  type: 'image' | 'video' | 'audio' | 'document'
  url: string
  title?: string
  alt?: string
}

export interface ScenarioCondition {
  id: string
  variableId: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists'
  value?: string | number | boolean
}

export interface ScenarioEffect {
  id: string
  type: 'set_variable' | 'increment_score' | 'complete' | 'bookmark'
  targetId?: string
  value?: string | number | boolean
}

export interface ScenarioChoice {
  id: string
  text: string
  targetNodeId?: string
  scoreDelta?: number
  feedback?: string
  conditions?: ScenarioCondition[]
  effects?: ScenarioEffect[]
}

export interface ScenarioFeedback {
  correct?: string
  incorrect?: string
  neutral?: string
}

export interface ScenarioFlowNode {
  id: string
  type: ScenarioNodeType
  speaker?: ScenarioSpeaker
  content: ScenarioContent
  choices: ScenarioChoice[]
  feedback?: ScenarioFeedback
  media: ScenarioMedia[]
  conditions: ScenarioCondition[]
  effects: ScenarioEffect[]
  position: { x: number; y: number }
  pluginData?: Record<string, unknown>
}

export interface ScenarioConnection {
  id: string
  sourceNodeId: string
  targetNodeId: string
  sourceChoiceId?: string
  label?: string
  conditions?: ScenarioCondition[]
  effects?: ScenarioEffect[]
}

export interface ScenarioVariable {
  id: string
  name: string
  type: 'string' | 'number' | 'boolean'
  defaultValue?: string | number | boolean
}

export interface ScenarioScoring {
  enabled: boolean
  maxScore?: number
  passingScore?: number
  completionMode: 'visited_end' | 'score' | 'manual'
}

export interface ScenarioDocument {
  schemaVersion: 1
  scenarioId: string
  title: string
  description?: string
  settings: {
    autosave: boolean
    allowBacktracking: boolean
    showProgress: boolean
    shuffleChoices: boolean
    completionTracking: boolean
    scoreTracking: boolean
  }
  nodes: ScenarioFlowNode[]
  connections: ScenarioConnection[]
  variables: ScenarioVariable[]
  scoring: ScenarioScoring
  metadata: {
    source: 'blank' | 'legacy_tree' | 'ai_draft' | 'import'
    version: number
    generatedAt?: string
    updatedAt?: string
    aiReady: boolean
    scormReady: boolean
  }
}

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
  author?: User
  modules: ScenarioModule[]
  shares?: ScenarioShare[]
  createdAt: string
  dateCreation?: string
  updatedAt: string
  objectif?: string
  niveau?: string
  dureeScenario?: number
  courseDocument?: CourseDocument
  courseDocumentVersion?: number
  scenarioDocument?: ScenarioDocument
  scenarioDocumentVersion?: number
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
  title?: string
  questions: Question[]
  passingScore: number
  timeLimit?: number
  attempts?: number
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
  attempts?: number
  completions: number
  completionRate?: number
  avgScore: number
  avgTime?: number
  status: ScenarioStatus
  successRate?: number
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
