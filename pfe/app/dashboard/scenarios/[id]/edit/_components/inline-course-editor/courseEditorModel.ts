import {
  AlignLeft,
  AudioLines,
  BadgeHelp,
  BarChart3,
  BookOpen,
  Bot,
  Braces,
  CheckSquare,
  ChevronRight,
  CircleDot,
  Columns3,
  Download,
  FileText,
  Flag,
  GitBranch,
  GripVertical,
  Image as ImageIcon,
  Layers,
  Link2,
  ListChecks,
  MessageCircle,
  MessageSquare,
  MousePointer2,
  PanelTop,
  Quote,
  RefreshCcw,
  Rows3,
  SlidersHorizontal,
  SplitSquareHorizontal,
  Star,
  Table2,
  TextCursorInput,
  Timer,
  Trophy,
  Type,
  Video,
} from 'lucide-react'
import type { ElementType } from 'react'
import type {
  CourseBlock,
  CourseBlockCategory,
  CourseBlockType,
  CourseDocument,
  CourseLesson,
  CoursePage,
  CoursePublishSettings,
  CourseQuizQuestion,
  CourseTheme,
} from '@/types'

export type CourseFormat = 'Linear' | 'Branching' | 'Hybrid' | 'Assessment-Only'
export type EditorView = 'structure' | 'lesson'
export type SaveStatus = 'saved' | 'saving' | 'dirty' | 'error'

export interface BlockDefinition {
  type: CourseBlockType
  category: CourseBlockCategory
  categoryLabel: string
  label: string
  description: string
  icon: ElementType
  questionOnly?: boolean
}

export interface ScormSettings {
  version: 'scorm_1_2' | 'scorm_2004_3rd' | 'xapi'
  completionTrigger: 'viewed_all' | 'passed_assessment' | 'completion_page' | 'custom'
  customCondition: string
  passingScore: number
  maxScore: number
  courseIdentifier: string
  lmsTitle: string
  lmsDescription: string
  language: string
  launchBehavior: 'new_window' | 'same_window'
  masteryScore: number
}

const categoryLabels: Record<CourseBlockCategory, string> = {
  text: 'Text & Narrative',
  text_narrative: 'Text & Narrative',
  statement: 'Text & Narrative',
  list: 'Text & Narrative',
  media: 'Media',
  dialogue_characters: 'Dialogue & Characters',
  questions: 'Questions & Assessments',
  knowledge_check: 'Questions & Assessments',
  branching_decision: 'Branching & Decision',
  interactive: 'Interactive & Engagement',
  interactive_engagement: 'Interactive & Engagement',
  data_reference: 'Data & Reference',
  navigation_completion: 'Navigation & Completion',
  chart: 'Data & Reference',
  divider: 'Text & Narrative',
}

export const blockCatalog: BlockDefinition[] = [
  { type: 'text', category: 'text_narrative', categoryLabel: 'Text & Narrative', label: 'Text', description: 'Rich-text paragraph with lists and links.', icon: AlignLeft },
  { type: 'heading', category: 'text_narrative', categoryLabel: 'Text & Narrative', label: 'Heading', description: 'Display heading with optional subtitle.', icon: Type },
  { type: 'callout', category: 'text_narrative', categoryLabel: 'Text & Narrative', label: 'Callout', description: 'Highlighted info, warning, tip, or note.', icon: BadgeHelp },
  { type: 'quote', category: 'text_narrative', categoryLabel: 'Text & Narrative', label: 'Quote', description: 'Pull-quote with attribution.', icon: Quote },
  { type: 'numbered_list', category: 'text_narrative', categoryLabel: 'Text & Narrative', label: 'Numbered List', description: 'Ordered list with large styled numbers.', icon: ListChecks },
  { type: 'divider', category: 'text_narrative', categoryLabel: 'Text & Narrative', label: 'Divider', description: 'Horizontal separator with optional label.', icon: GripVertical },

  { type: 'image', category: 'media', categoryLabel: 'Media', label: 'Image', description: 'Single image with caption and alt text.', icon: ImageIcon },
  { type: 'image_gallery', category: 'media', categoryLabel: 'Media', label: 'Image Gallery', description: 'Grid or carousel of images.', icon: Columns3 },
  { type: 'video', category: 'media', categoryLabel: 'Media', label: 'Video', description: 'Upload MP4 or embed YouTube/Vimeo.', icon: Video },
  { type: 'audio', category: 'media', categoryLabel: 'Media', label: 'Audio', description: 'Audio player with optional transcript.', icon: AudioLines },
  { type: 'embed', category: 'media', categoryLabel: 'Media', label: 'Embed', description: 'iFrame or external content embed.', icon: Braces },

  { type: 'dialogue', category: 'dialogue_characters', categoryLabel: 'Dialogue & Characters', label: 'Dialogue', description: 'Multi-turn conversation with characters.', icon: MessageSquare },
  { type: 'character_monologue', category: 'dialogue_characters', categoryLabel: 'Dialogue & Characters', label: 'Character Monologue', description: 'Single character speaking to the learner.', icon: MessageCircle },
  { type: 'branching_dialogue', category: 'dialogue_characters', categoryLabel: 'Dialogue & Characters', label: 'Branching Dialogue', description: 'Conversation with learner choices.', icon: GitBranch },

  { type: 'multiple_choice', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Multiple Choice', description: 'One correct answer from 2 to 6 options.', icon: CircleDot, questionOnly: true },
  { type: 'multiple_select', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Multiple Select', description: 'One or more correct answers.', icon: CheckSquare, questionOnly: true },
  { type: 'true_false', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'True / False', description: 'Binary choice with explanation.', icon: SplitSquareHorizontal, questionOnly: true },
  { type: 'fill_blank', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Fill in the Blank', description: 'Typed blank inside a sentence.', icon: TextCursorInput, questionOnly: true },
  { type: 'matching', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Matching', description: 'Connect pairs from two columns.', icon: Columns3, questionOnly: true },
  { type: 'ordering', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Ordering / Ranking', description: 'Drag items into the correct sequence.', icon: Rows3, questionOnly: true },
  { type: 'hotspot', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Hotspot', description: 'Learner clicks correct image regions.', icon: MousePointer2, questionOnly: true },
  { type: 'short_answer', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Short Answer', description: 'Free-form response with optional keywords.', icon: AlignLeft, questionOnly: true },
  { type: 'likert', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Likert Scale', description: 'Agreement scale response.', icon: SlidersHorizontal, questionOnly: true },
  { type: 'rating_slider', category: 'questions', categoryLabel: 'Questions & Assessments', label: 'Rating Slider', description: 'Numeric slider response.', icon: SlidersHorizontal, questionOnly: true },

  { type: 'choice_point', category: 'branching_decision', categoryLabel: 'Branching & Decision', label: 'Choice Point', description: 'Options that lead to different lessons.', icon: GitBranch },
  { type: 'consequence', category: 'branching_decision', categoryLabel: 'Branching & Decision', label: 'Consequence', description: 'Result shown after a choice.', icon: ChevronRight },
  { type: 'decision_recap', category: 'branching_decision', categoryLabel: 'Branching & Decision', label: 'Decision Recap', description: 'Summary of choices made.', icon: FileText },
  { type: 'branch_merge', category: 'branching_decision', categoryLabel: 'Branching & Decision', label: 'Branch Merge', description: 'Internal marker for converging paths.', icon: GitBranch },
  { type: 'conditional_gate', category: 'branching_decision', categoryLabel: 'Branching & Decision', label: 'Conditional Gate', description: 'Content locked until a condition is met.', icon: Flag },

  { type: 'accordion', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Accordion', description: 'Expandable stacked panels.', icon: Layers },
  { type: 'tabs', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Tabs', description: 'Horizontal tabbed panels.', icon: PanelTop },
  { type: 'flashcards', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Flashcards', description: 'Flip-card pairs.', icon: BookOpen },
  { type: 'timeline', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Timeline', description: 'Chronological event display.', icon: Timer },
  { type: 'checklist', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Checklist', description: 'Interactive checkbox list.', icon: CheckSquare },
  { type: 'reveal', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Reveal', description: 'Hidden content behind a trigger.', icon: MousePointer2 },
  { type: 'sorting_activity', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Sorting Activity', description: 'Drag items into categories.', icon: Rows3 },
  { type: 'before_after', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Before/After Slider', description: 'Two images with draggable divider.', icon: SplitSquareHorizontal },
  { type: 'process_steps', category: 'interactive_engagement', categoryLabel: 'Interactive & Engagement', label: 'Process Steps', description: 'Sequential expandable steps.', icon: ListChecks },

  { type: 'table', category: 'data_reference', categoryLabel: 'Data & Reference', label: 'Table', description: 'Editable data table with headers.', icon: Table2 },
  { type: 'chart', category: 'data_reference', categoryLabel: 'Data & Reference', label: 'Chart', description: 'Bar, line, or pie chart from data.', icon: BarChart3 },
  { type: 'resource_link', category: 'data_reference', categoryLabel: 'Data & Reference', label: 'Resource Link', description: 'Styled card with title, description, URL.', icon: Link2 },
  { type: 'file_download', category: 'data_reference', categoryLabel: 'Data & Reference', label: 'File Download', description: 'Downloadable file attachment.', icon: Download },
  { type: 'glossary', category: 'data_reference', categoryLabel: 'Data & Reference', label: 'Glossary Term', description: 'Highlighted word with definition pop-up.', icon: Bot },

  { type: 'continue_button', category: 'navigation_completion', categoryLabel: 'Navigation & Completion', label: 'Continue Button', description: 'Explicit proceed button.', icon: ChevronRight },
  { type: 'lesson_summary', category: 'navigation_completion', categoryLabel: 'Navigation & Completion', label: 'Lesson Summary', description: 'Key points recap.', icon: FileText },
  { type: 'score_summary', category: 'navigation_completion', categoryLabel: 'Navigation & Completion', label: 'Score Summary', description: 'Score and pass/fail status.', icon: Trophy },
  { type: 'certificate', category: 'navigation_completion', categoryLabel: 'Navigation & Completion', label: 'Certificate', description: 'Completion certificate.', icon: Star },
  { type: 'completion_message', category: 'navigation_completion', categoryLabel: 'Navigation & Completion', label: 'Completion Message', description: 'Custom end-of-course message.', icon: Flag },
  { type: 'restart_button', category: 'navigation_completion', categoryLabel: 'Navigation & Completion', label: 'Restart Button', description: 'Restart current lesson or whole course.', icon: RefreshCcw },
]

export const blockCategories = Array.from(new Set(blockCatalog.map((block) => block.categoryLabel)))

export const formatOptions: CourseFormat[] = ['Linear', 'Branching', 'Hybrid', 'Assessment-Only']

const defaultTheme: CourseTheme = {
  accentColor: '#0F6B4A',
  fontPairing: 'modern',
  coverLayout: 'centered',
  navigationMode: 'continuous',
  lessonNumbers: true,
  sidebarEnabled: true,
}

const defaultPublish: CoursePublishSettings = {
  target: 'lms',
  lmsStandard: 'scorm_1_2',
  tracking: 'completion_and_score',
  completionPercentage: 100,
  passingScore: 80,
  reportingStatus: 'completed_passed',
}

export function uid(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export function authorNameFrom(user?: { firstName?: string; lastName?: string; email?: string } | null) {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  return name || user?.email || 'Author'
}

export function getBlockDefinition(type: CourseBlockType) {
  return blockCatalog.find((block) => block.type === type) ?? blockCatalog[0]
}

export function isQuestionBlock(type: CourseBlockType) {
  return blockCatalog.some((block) => block.type === type && block.questionOnly)
}

export function createEmptyCourseDocument(title: string, authorName: string): CourseDocument {
  return syncCourseDocument({
    schemaVersion: 1,
    id: uid('course'),
    title,
    description: '',
    objectives: [],
    sections: [{ id: uid('section'), title: 'Course content', lessonIds: [] }],
    lessons: [],
    pages: [],
    settings: {
      completionMode: 'pages',
      passingScore: 80,
      scormVersion: '1.2',
      completionPercentage: 100,
      requireQuizPass: false,
    },
    theme: defaultTheme,
    publish: defaultPublish,
    metadata: {
      source: 'course_engine',
      generatedAt: new Date().toISOString(),
      version: 1,
      authorName,
      audience: '',
      duration: '',
      format: 'Linear',
      tone: '',
      scorm: { ...createDefaultScormSettings(title, '') },
    },
  })
}

export function normalizeCourseDocument(document: CourseDocument, authorName: string): CourseDocument {
  const lessons = (document.lessons?.length ? document.lessons : document.pages.map(pageToLesson)).map((lesson) => ({
    ...lesson,
    type: lesson.type ?? 'lesson',
    blocks: lesson.blocks ?? [],
    metadata: {
      ...lesson.metadata,
      authorName: typeof lesson.metadata?.authorName === 'string' ? lesson.metadata.authorName : authorName,
    },
  }))

  return syncCourseDocument({
    ...document,
    title: document.title ?? '',
    description: document.description ?? '',
    objectives: document.objectives ?? [],
    lessons,
    theme: { ...defaultTheme, ...document.theme },
    publish: { ...defaultPublish, ...document.publish },
    metadata: {
      ...document.metadata,
      source: 'course_engine',
      authorName: typeof document.metadata?.authorName === 'string' ? document.metadata.authorName : authorName,
      audience: typeof document.metadata?.audience === 'string' ? document.metadata.audience : '',
      duration: typeof document.metadata?.duration === 'string' ? document.metadata.duration : '',
      format: typeof document.metadata?.format === 'string' ? document.metadata.format : 'Linear',
      tone: typeof document.metadata?.tone === 'string' ? document.metadata.tone : '',
      scorm: {
        ...createDefaultScormSettings(document.title ?? '', document.description ?? ''),
        ...(typeof document.metadata?.scorm === 'object' && document.metadata.scorm ? document.metadata.scorm : {}),
      },
    },
  })
}

export function syncCourseDocument(document: CourseDocument): CourseDocument {
  const lessons = document.lessons ?? []
  return {
    ...document,
    lessons,
    sections: [
      {
        id: document.sections?.[0]?.id ?? uid('section'),
        title: document.sections?.[0]?.title ?? 'Course content',
        lessonIds: lessons.map((lesson) => lesson.id),
      },
    ],
    pages: lessons.map(lessonToPage),
    settings: {
      completionMode: document.settings?.completionMode ?? 'pages',
      passingScore: document.settings?.passingScore ?? 80,
      scormVersion: document.settings?.scormVersion ?? '1.2',
      completionPercentage: document.settings?.completionPercentage ?? 100,
      requireQuizPass: document.settings?.requireQuizPass ?? false,
    },
    theme: { ...defaultTheme, ...document.theme },
    publish: { ...defaultPublish, ...document.publish },
    metadata: {
      ...document.metadata,
      source: 'course_engine',
      updatedAt: new Date().toISOString(),
    },
  }
}

export function createLesson(title: string): CourseLesson {
  return {
    id: uid('lesson'),
    type: 'lesson',
    title,
    summary: '',
    estimatedMinutes: undefined,
    blocks: [],
    metadata: {
      contentKind: 'unset',
    },
  }
}

export function setLessonKind(lesson: CourseLesson, type: 'lesson' | 'quiz'): CourseLesson {
  return {
    ...lesson,
    type,
    metadata: {
      ...lesson.metadata,
      contentKind: type,
    },
    quiz:
      type === 'quiz'
        ? lesson.quiz ?? {
            passingScore: 80,
            attempts: 1,
            randomizeQuestions: false,
            randomizeAnswers: false,
            showFeedback: true,
            questions: [],
          }
        : undefined,
  }
}

export function createBlock(type: CourseBlockType): CourseBlock {
  const definition = getBlockDefinition(type)
  return {
    id: uid('block'),
    type,
    category: definition.category,
    title: '',
    content: '',
    assetUrl: '',
    items: defaultItemsFor(type),
    metadata: defaultMetadataFor(type),
  }
}

export function duplicateBlock(block: CourseBlock): CourseBlock {
  return {
    ...block,
    id: uid('block'),
    items: block.items?.map((item) => ({ ...item, id: uid('item') })),
    metadata: { ...block.metadata },
  }
}

export function blockHasContent(block: CourseBlock) {
  const hasText = Boolean(block.title?.trim() || block.content?.trim() || block.assetUrl?.trim())
  const hasItems = (block.items ?? []).some((item) =>
    Boolean(item.title?.trim() || item.content?.trim() || item.mediaUrl?.trim() || item.match?.trim()),
  )
  const metadata = block.metadata ?? {}
  const hasMetadata = Object.entries(metadata).some(([key, value]) => {
    if (['style', 'level', 'width', 'layout', 'required', 'shuffle', 'allowRetry', 'points'].includes(key)) return false
    return value !== undefined && value !== null && value !== ''
  })
  return hasText || hasItems || hasMetadata
}

export function getScormSettings(document: CourseDocument): ScormSettings {
  return {
    ...createDefaultScormSettings(document.title, document.description ?? ''),
    ...(typeof document.metadata?.scorm === 'object' && document.metadata.scorm ? document.metadata.scorm : {}),
  } as ScormSettings
}

export function createManifestPreview(document: CourseDocument) {
  const scorm = getScormSettings(document)
  return `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${escapeXml(scorm.courseIdentifier)}" version="1.0"
  xmlns="http://www.imsglobal.org/xsd/imscp_v1p1"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_v1p3"
  xmlns:imsss="http://www.imsglobal.org/xsd/imsss">
  <metadata>
    <schema>${scorm.version === 'xapi' ? 'xAPI Tin Can' : 'ADL SCORM'}</schema>
    <schemaversion>${scorm.version === 'scorm_2004_3rd' ? '2004 3rd Edition' : '1.2'}</schemaversion>
  </metadata>
  <organizations default="org-${escapeXml(document.id)}">
    <organization identifier="org-${escapeXml(document.id)}">
      <title>${escapeXml(scorm.lmsTitle || document.title)}</title>
      ${document.pages.map((page) => `      <item identifier="item-${escapeXml(page.id)}" identifierref="res-${escapeXml(page.id)}"><title>${escapeXml(page.title)}</title></item>`).join('\n')}
    </organization>
  </organizations>
  <resources>
    ${document.pages.map((page) => `<resource identifier="res-${escapeXml(page.id)}" type="webcontent" adlcp:scormType="sco" href="index.html#${escapeXml(page.id)}">
      <file href="index.html" />
      <file href="scorm-api-bridge.js" />
    </resource>`).join('\n    ')}
  </resources>
</manifest>`
}

function createDefaultScormSettings(title: string, description: string): ScormSettings {
  return {
    version: 'scorm_1_2',
    completionTrigger: 'viewed_all',
    customCondition: '',
    passingScore: 80,
    maxScore: 100,
    courseIdentifier: uid('course-id'),
    lmsTitle: title,
    lmsDescription: description,
    language: 'en-US',
    launchBehavior: 'new_window',
    masteryScore: 80,
  }
}

function lessonToPage(lesson: CourseLesson): CoursePage {
  return {
    id: lesson.id,
    type: lesson.type === 'quiz' ? 'quiz' : 'lesson',
    title: lesson.title,
    summary: lesson.summary,
    blocks: lesson.blocks,
    quiz: lesson.quiz
      ? {
          passingScore: lesson.quiz.passingScore,
          questions: lesson.quiz.questions,
        }
      : undefined,
    metadata: lesson.metadata,
  }
}

function pageToLesson(page: CoursePage): CourseLesson {
  return {
    id: page.id,
    type: page.type === 'quiz' ? 'quiz' : 'lesson',
    title: page.title,
    summary: page.summary,
    blocks: page.blocks ?? [],
    quiz: page.quiz
      ? {
          passingScore: page.quiz.passingScore,
          questions: page.quiz.questions as CourseQuizQuestion[],
        }
      : undefined,
    metadata: page.metadata,
  }
}

function defaultItemsFor(type: CourseBlockType) {
  if (['numbered_list', 'checklist', 'lesson_summary', 'ordering', 'process_steps'].includes(type)) {
    return [
      { id: uid('item'), title: '', content: '' },
      { id: uid('item'), title: '', content: '' },
    ]
  }
  if (['accordion', 'tabs', 'flashcards', 'timeline', 'sorting_activity', 'matching'].includes(type)) {
    return [
      { id: uid('item'), title: '', content: '', match: '' },
      { id: uid('item'), title: '', content: '', match: '' },
    ]
  }
  if (['multiple_choice', 'multiple_select'].includes(type)) {
    return [
      { id: uid('option'), title: '', content: 'false' },
      { id: uid('option'), title: '', content: 'false' },
    ]
  }
  if (type === 'true_false') {
    return [
      { id: uid('option'), title: 'True', content: 'false' },
      { id: uid('option'), title: 'False', content: 'false' },
    ]
  }
  if (type === 'image_gallery') {
    return [
      { id: uid('image'), title: '', mediaUrl: '', content: '' },
      { id: uid('image'), title: '', mediaUrl: '', content: '' },
    ]
  }
  return []
}

function defaultMetadataFor(type: CourseBlockType): Record<string, unknown> {
  const questionDefaults = isQuestionBlock(type)
    ? {
        points: 1,
        hint: '',
        required: true,
        shuffle: false,
        allowRetry: true,
        maxAttempts: 1,
        correctFeedback: '',
        incorrectFeedback: '',
        partialFeedback: '',
      }
    : {}

  const defaults: Partial<Record<CourseBlockType, Record<string, unknown>>> = {
    heading: { level: 'H2', subtitle: '' },
    callout: { style: 'Info' },
    quote: { attributionName: '', attributionRole: '', avatarUrl: '' },
    divider: { style: 'solid', label: '' },
    image: { caption: '', alt: '', width: 'medium' },
    image_gallery: { layout: '2-col grid' },
    video: { autoplay: false, caption: '' },
    audio: { transcript: '' },
    embed: { height: 420, iframe: '' },
    dialogue: { bubbleStyle: 'Chat' },
    character_monologue: { characterName: '', avatarUrl: '', emotion: 'neutral', alignment: 'left' },
    branching_dialogue: { bubbleStyle: 'Chat' },
    fill_blank: { acceptedAnswers: '', caseSensitive: false },
    true_false: { correctAnswer: 'True', explanation: '' },
    matching: { instructions: '' },
    hotspot: { imageUrl: '', regions: '' },
    short_answer: { keywords: '', manualReview: false },
    likert: { scaleSize: 5, lowLabel: 'Strongly disagree', highLabel: 'Strongly agree' },
    rating_slider: { min: 0, max: 10, step: 1, minLabel: '', maxLabel: '' },
    choice_point: { destinationMode: 'lesson' },
    consequence: { imageUrl: '', label: 'Result:' },
    decision_recap: { autoPopulate: true, intro: '' },
    branch_merge: { internalLabel: '' },
    conditional_gate: { conditionType: 'viewed lesson', target: '', lockedMessage: '' },
    timeline: { orientation: 'vertical' },
    checklist: { showProgress: true },
    reveal: { triggerLabel: 'Reveal', hiddenContent: '' },
    sorting_activity: { graded: false },
    before_after: { beforeImage: '', afterImage: '', beforeLabel: 'Before', afterLabel: 'After' },
    table: { rows: 3, columns: 3, headerRow: true },
    chart: { chartType: 'bar', data: '', axisLabels: '', chartTitle: '' },
    resource_link: { url: '', icon: '' },
    file_download: { fileUrl: '', label: '', description: '' },
    glossary: { term: '', definition: '', example: '' },
    continue_button: { label: 'Continue', alignment: 'center' },
    score_summary: { sourceQuiz: '', passMessage: '', failMessage: '' },
    certificate: { logoUrl: '', signatureUrl: '' },
    completion_message: { imageUrl: '' },
    restart_button: { label: 'Restart', scope: 'entire course' },
  }

  return {
    ...questionDefaults,
    ...(defaults[type] ?? {}),
  }
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function categoryLabelFor(category?: CourseBlockCategory) {
  return category ? categoryLabels[category] ?? category : 'Blocks'
}
