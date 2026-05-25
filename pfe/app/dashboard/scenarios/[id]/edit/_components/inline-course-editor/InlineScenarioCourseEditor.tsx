'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
  type RefObject,
} from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import {
  AlignLeft,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  Columns3,
  Copy,
  Download,
  Eye,
  GripVertical,
  Image as ImageIcon,
  Layers,
  LibraryBig,
  List,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Pencil,
  Plus,
  Redo2,
  Settings,
  Sparkles,
  SquareLibrary,
  Trash2,
  Type,
  Undo2,
  Video,
  X,
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { scenariosApi, scormApi } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import type {
  CourseBlock,
  CourseBlockType,
  CourseDocument,
  CourseInteractionItem,
  CourseLesson,
  Scenario,
} from '@/types'
import {
  authorNameFrom,
  blockHasContent,
  categoryLabelFor,
  createBlock,
  createEmptyCourseDocument,
  createLesson,
  createManifestPreview,
  duplicateBlock,
  formatOptions,
  getBlockDefinition,
  getScormSettings,
  isQuestionBlock,
  normalizeCourseDocument,
  setLessonKind,
  syncCourseDocument,
  uid,
  type CourseFormat,
  type ScormSettings,
  type SaveStatus,
} from './courseEditorModel'
import { useCourseDocumentAutosave } from './useCourseDocumentAutosave'

interface InlineScenarioCourseEditorProps {
  mode: 'create' | 'edit'
  scenarioId?: string
  scenario?: Scenario
}

type EditorViewState =
  | { type: 'structure' }
  | { type: 'lesson'; lessonId: string }

const inputClass =
  'rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 py-2 text-sm text-[var(--lux-text)] outline-none placeholder:text-[var(--lux-muted-soft)] focus:border-[var(--lux-primary)] focus:ring-2 focus:ring-[var(--lux-primary)]/20'

const textareaClass =
  'w-full resize-none rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 py-2 text-sm leading-6 text-[var(--lux-text)] outline-none placeholder:text-[var(--lux-muted-soft)] focus:border-[var(--lux-primary)] focus:ring-2 focus:ring-[var(--lux-primary)]/20'

const selectClass =
  'rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 py-2 text-sm text-[var(--lux-text)] outline-none focus:border-[var(--lux-primary)]'

const ghostInputClass =
  'w-full bg-transparent text-[var(--lux-text)] outline-none placeholder:text-[var(--lux-muted-soft)]'

const inlineSurfaceInputClass =
  'w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-[var(--lux-text)] outline-none placeholder:text-[var(--lux-muted-soft)] focus:border-[var(--lux-primary)] focus:bg-[var(--lux-surface)] focus:ring-2 focus:ring-[var(--lux-primary)]/15'

const inlineSurfaceTextareaClass =
  'w-full resize-none rounded-md border border-transparent bg-transparent px-2 py-1 text-[var(--lux-text)] outline-none placeholder:text-[var(--lux-muted-soft)] focus:border-[var(--lux-primary)] focus:bg-[var(--lux-surface)] focus:ring-2 focus:ring-[var(--lux-primary)]/15'

const quickInsertBlocks: Array<{ type: CourseBlockType; label: string; icon: typeof Type; ai?: boolean }> = [
  { type: 'text', label: 'AI Block', icon: Sparkles, ai: true },
  { type: 'image', label: 'AI Image', icon: ImageIcon, ai: true },
  { type: 'audio', label: 'AI Audio', icon: Mic, ai: true },
  { type: 'text', label: 'Text', icon: Type },
  { type: 'numbered_list', label: 'List', icon: List },
  { type: 'image', label: 'Image', icon: ImageIcon },
  { type: 'video', label: 'Video', icon: Video },
  { type: 'process_steps', label: 'Process', icon: Columns3 },
  { type: 'flashcards', label: 'Flashcards', icon: SquareLibrary },
  { type: 'sorting_activity', label: 'Sorting', icon: Layers },
  { type: 'continue_button', label: 'Continue', icon: Download },
]

const blockLibraryGroups: Array<{ label: string; icon: typeof Type; type?: CourseBlockType; ai?: boolean; beta?: boolean }> = [
  { label: 'AI blocks', icon: Sparkles, type: 'text', ai: true },
  { label: 'Text', icon: Type, type: 'text' },
  { label: 'Statement', icon: MessageCircle, type: 'callout' },
  { label: 'Quote', icon: MessageCircle, type: 'quote' },
  { label: 'List', icon: List, type: 'numbered_list' },
  { label: 'Image', icon: ImageIcon, type: 'image' },
  { label: 'Gallery', icon: Columns3, type: 'image_gallery' },
  { label: 'Multimedia', icon: Video, type: 'video' },
  { label: 'Interactive', icon: AlignLeft, type: 'tabs' },
  { label: 'Knowledge check', icon: BookOpen, type: 'multiple_choice' },
  { label: 'Chart', icon: Columns3, type: 'chart' },
  { label: 'Divider', icon: GripVertical, type: 'divider' },
  { label: 'Block templates', icon: SquareLibrary, type: 'lesson_summary' },
  { label: 'Code', icon: MoreHorizontal, type: 'embed' },
  { label: 'Custom block', icon: Pencil, type: 'text', beta: true },
]

export function InlineScenarioCourseEditor({
  mode,
  scenarioId,
}: InlineScenarioCourseEditorProps) {
  const { user } = useAuth()
  const qc = useQueryClient()
  const authorName = authorNameFrom(user)
  const [persistedScenarioId, setPersistedScenarioId] = useState<string | undefined>(scenarioId)
  const [document, setDocument] = useState<CourseDocument>(() => createEmptyCourseDocument('', authorName))
  const [titleCommitted, setTitleCommitted] = useState(mode === 'edit')
  const [titleDraft, setTitleDraft] = useState('')
  const [titleError, setTitleError] = useState('')
  const [view, setView] = useState<EditorViewState>({ type: 'structure' })
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [manifestOpen, setManifestOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement | null>(null)
  const lessonInputRef = useRef<HTMLInputElement | null>(null)
  const hydratedDocumentIdRef = useRef<string | null>(null)

  const { data: loadedDocument, isLoading } = useQuery<CourseDocument>({
    queryKey: ['course-document', scenarioId],
    enabled: mode === 'edit' && !!scenarioId,
    queryFn: () => scenariosApi.getCourseDocument(scenarioId as string).then((response) => response.data),
  })

  useEffect(() => {
    if (mode !== 'edit' || !loadedDocument || hydratedDocumentIdRef.current === loadedDocument.id) return
    const normalized = normalizeCourseDocument(loadedDocument, authorName)
    hydratedDocumentIdRef.current = loadedDocument.id
    setDocument(normalized)
    setTitleDraft(normalized.title)
    setTitleCommitted(true)
  }, [authorName, loadedDocument, mode])

  useEffect(() => {
    if (!titleCommitted) {
      titleInputRef.current?.focus()
    } else if (document.lessons?.length === 0 && view.type === 'structure') {
      window.setTimeout(() => lessonInputRef.current?.focus(), 80)
    }
  }, [document.lessons?.length, titleCommitted, view.type])

  const createScenarioMutation = useMutation({
    mutationFn: (nextDocument: CourseDocument) =>
      scenariosApi.create({
        title: nextDocument.title,
        description: nextDocument.description,
        template: 'BLANK',
        courseDocument: nextDocument,
      }),
    onSuccess: (response) => {
      const created = response.data as Scenario
      setPersistedScenarioId(created.id)
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
    onError: () => {
      toast.error('Could not create scenario')
    },
  })

  const autosave = useCourseDocumentAutosave({
    scenarioId: persistedScenarioId,
    document,
    enabled: titleCommitted && !!persistedScenarioId,
    onSaved: (savedDocument) => {
      qc.setQueryData(['course-document', persistedScenarioId], savedDocument)
      qc.invalidateQueries({ queryKey: ['scenario', persistedScenarioId] })
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })

  const saveStatus: SaveStatus = createScenarioMutation.isPending ? 'saving' : autosave.status
  const saveLabel = createScenarioMutation.isPending ? 'Saving...' : autosave.label

  const updateDocument = useCallback((updater: (current: CourseDocument) => CourseDocument) => {
    setDocument((current) => syncCourseDocument(updater(current)))
  }, [])

  const commitCourseTitle = useCallback(() => {
    const nextTitle = titleDraft.trim()
    if (!nextTitle) {
      setTitleError('A course title is required.')
      titleInputRef.current?.focus()
      return
    }

    setTitleError('')
    const nextDocument = syncCourseDocument({
      ...document,
      title: nextTitle,
      metadata: {
        ...document.metadata,
        authorName: document.metadata?.authorName || authorName,
        scorm: {
          ...getScormSettings(document),
          lmsTitle: nextTitle,
        },
      },
    })

    setDocument(nextDocument)
    setTitleCommitted(true)

    if (!persistedScenarioId) {
      createScenarioMutation.mutate(nextDocument)
    }
  }, [authorName, createScenarioMutation, document, persistedScenarioId, titleDraft])

  const addLesson = useCallback((title: string) => {
    const nextTitle = title.trim()
    if (!nextTitle) return false
    const lesson = createLesson(nextTitle)
    updateDocument((current) => ({
      ...current,
      lessons: [...(current.lessons ?? []), lesson],
    }))
    return true
  }, [updateDocument])

  const updateLesson = useCallback((lessonId: string, updater: (lesson: CourseLesson) => CourseLesson) => {
    updateDocument((current) => ({
      ...current,
      lessons: (current.lessons ?? []).map((lesson) =>
        lesson.id === lessonId ? updater(lesson) : lesson,
      ),
    }))
  }, [updateDocument])

  const removeLesson = useCallback((lessonId: string) => {
    updateDocument((current) => ({
      ...current,
      lessons: (current.lessons ?? []).filter((lesson) => lesson.id !== lessonId),
    }))
    if (view.type === 'lesson' && view.lessonId === lessonId) {
      setView({ type: 'structure' })
    }
  }, [updateDocument, view])

  const selectedLesson = view.type === 'lesson'
    ? document.lessons?.find((lesson) => lesson.id === view.lessonId) ?? null
    : null

  if (mode === 'edit' && isLoading && !loadedDocument) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--lux-bg)]">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="rise-editor min-h-full bg-[var(--lux-bg)] font-sans text-[var(--lux-text)]">
      <TopSaveBar
        status={saveStatus}
        label={saveLabel}
        onRetry={autosave.retry}
        showRetry={saveStatus === 'error'}
      />

      {view.type === 'structure' ? (
        <main className="min-h-[calc(100vh-2.5rem)] bg-[var(--lux-bg)] px-4 py-6 sm:px-8">
          <div className="mx-auto mb-5 flex w-full max-w-[952px] items-center justify-between gap-3">
            <Link
              href="/dashboard/scenarios"
              className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm font-semibold text-[var(--lux-muted)] hover:bg-[var(--lux-overlay-hover)] hover:text-[var(--lux-text)]"
            >
              <ArrowLeft size={16} />
              Courses
            </Link>
            {titleCommitted && (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setPreviewOpen(true)}>
                  <Eye size={14} className="mr-1" />
                  Preview
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setSettingsOpen((current) => !current)}>
                  <Settings size={14} className="mr-1" />
                  Settings
                </Button>
                <Button size="sm" onClick={() => setSettingsOpen(true)}>
                  <Download size={14} className="mr-1" />
                  Export
                </Button>
              </div>
            )}
          </div>

          {!titleCommitted ? (
            <section className="mx-auto mt-8 max-w-[952px] px-0 py-8 sm:mt-12 sm:py-12">
              <p className="sr-only">New course</p>
              <div className="flex items-start gap-3">
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(event) => {
                    setTitleDraft(event.target.value)
                    setTitleError('')
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') commitCourseTitle()
                  }}
                  placeholder="Enter course title..."
                  className="min-w-0 flex-1 bg-transparent text-[44px] font-bold leading-tight text-[var(--lux-text-strong)] outline-none placeholder:text-[var(--lux-muted-soft)] sm:text-[52px]"
                />
                <button
                  type="button"
                  onClick={commitCourseTitle}
                  className="mt-2 grid h-11 w-11 flex-shrink-0 place-items-center rounded-full bg-[var(--lux-primary)] text-[var(--lux-text-strong)] shadow-sm hover:bg-[var(--lux-primary-hover)]"
                  aria-label="Confirm course title"
                >
                  <Check size={18} />
                </button>
              </div>
              {titleError && <p className="mt-3 text-sm font-medium text-red-600">{titleError}</p>}
            </section>
          ) : (
            <StructurePage
              document={document}
              authorName={authorName}
              lessonInputRef={lessonInputRef}
              settingsOpen={settingsOpen}
              manifestOpen={manifestOpen}
              scenarioId={persistedScenarioId}
              onToggleManifest={() => setManifestOpen((current) => !current)}
              onUpdateDocument={updateDocument}
              onEditTitle={() => {
                setTitleDraft(document.title)
                setTitleCommitted(false)
              }}
              onAddLesson={addLesson}
              onUpdateLesson={updateLesson}
              onRemoveLesson={removeLesson}
              onOpenLesson={(lessonId) => setView({ type: 'lesson', lessonId })}
            />
          )}
        </main>
      ) : selectedLesson ? (
        <LessonEditor
          document={document}
          lesson={selectedLesson}
          authorName={authorName}
          settingsOpen={settingsOpen}
          onBack={() => {
            setSettingsOpen(false)
            setView({ type: 'structure' })
          }}
          onToggleSettings={() => setSettingsOpen((current) => !current)}
          onUpdateDocument={updateDocument}
          onUpdateLesson={(updater) => updateLesson(selectedLesson.id, updater)}
        />
      ) : null}

      {previewOpen && (
        <CoursePreview document={document} onClose={() => setPreviewOpen(false)} />
      )}
    </div>
  )
}

function TopSaveBar({
  status,
  label,
  showRetry,
  onRetry,
}: {
  status: SaveStatus
  label: string
  showRetry: boolean
  onRetry: () => void
}) {
  return (
    <div className="sticky top-0 z-30 flex flex-col border-b border-[var(--lux-line)] bg-[var(--lux-surface)]/95 backdrop-blur">
      <div className="flex h-10 items-center justify-end px-4">
        <button
          type="button"
          onClick={showRetry ? onRetry : undefined}
          title={status === 'error' ? label : undefined}
          className={cn(
            'max-w-[420px] truncate rounded-full px-2.5 py-1 text-xs font-semibold',
            status === 'error'
              ? 'bg-red-50 text-red-600 hover:text-red-700'
              : status === 'saving'
                ? 'bg-[var(--lux-primary-soft)] text-[var(--lux-primary-muted)]'
                : 'bg-[var(--lux-overlay)] text-[var(--lux-muted)]',
          )}
        >
          {status === 'error' ? '⚠ ' : ''}{label}
        </button>
      </div>

      {status === 'error' && (
        <div className="flex items-center gap-3 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">
          <span className="flex-1">{label}</span>
          <button
            type="button"
            onClick={onRetry}
            className="font-semibold underline underline-offset-2 hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}

function StructurePage({
  document,
  authorName,
  lessonInputRef,
  settingsOpen,
  manifestOpen,
  scenarioId,
  onToggleManifest,
  onUpdateDocument,
  onEditTitle,
  onAddLesson,
  onUpdateLesson,
  onRemoveLesson,
  onOpenLesson,
}: {
  document: CourseDocument
  authorName: string
  lessonInputRef: RefObject<HTMLInputElement | null>
  settingsOpen: boolean
  manifestOpen: boolean
  scenarioId?: string
  onToggleManifest: () => void
  onUpdateDocument: (updater: (document: CourseDocument) => CourseDocument) => void
  onEditTitle: () => void
  onAddLesson: (title: string) => boolean
  onUpdateLesson: (lessonId: string, updater: (lesson: CourseLesson) => CourseLesson) => void
  onRemoveLesson: (lessonId: string) => void
  onOpenLesson: (lessonId: string) => void
}) {
  const [draggedLessonId, setDraggedLessonId] = useState<string | null>(null)

  const reorderLesson = (targetLessonId: string) => {
    if (!draggedLessonId || draggedLessonId === targetLessonId) return
    onUpdateDocument((current) => {
      const lessons = [...(current.lessons ?? [])]
      const from = lessons.findIndex((lesson) => lesson.id === draggedLessonId)
      const to = lessons.findIndex((lesson) => lesson.id === targetLessonId)
      if (from < 0 || to < 0) return current
      const [moved] = lessons.splice(from, 1)
      lessons.splice(to, 0, moved)
      return { ...current, lessons }
    })
    setDraggedLessonId(null)
  }

  const lessons = document.lessons ?? []

  return (
    <div className="mx-auto w-full max-w-[952px] pb-10">
      <section className="fade-up pt-6 sm:pt-8">
        <button
          type="button"
          onClick={onEditTitle}
          className="block max-w-4xl text-left text-[44px] font-bold leading-tight text-[var(--lux-muted)] hover:text-[var(--lux-text-strong)] sm:text-[52px]"
        >
          {document.title}
        </button>

        <CourseHeader
          document={document}
          authorName={authorName}
          onUpdateDocument={onUpdateDocument}
        />
      </section>

      {settingsOpen && (
        <div className="mt-5">
          <ScormPanel
            document={document}
            scenarioId={scenarioId}
            manifestOpen={manifestOpen}
            onToggleManifest={onToggleManifest}
            onUpdateDocument={onUpdateDocument}
          />
        </div>
      )}

      <section className="mt-16 sm:mt-20">
        <div className="divide-y divide-[var(--lux-line)] border-b border-[var(--lux-line)]">
          {lessons.map((lesson) => (
            <LessonStructureItem
              key={lesson.id}
              lesson={lesson}
              draggable
              onDragStart={() => setDraggedLessonId(lesson.id)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => reorderLesson(lesson.id)}
              onUpdate={(updater) => onUpdateLesson(lesson.id, updater)}
              onRemove={() => onRemoveLesson(lesson.id)}
              onOpen={() => onOpenLesson(lesson.id)}
            />
          ))}
          <AddLessonInput inputRef={lessonInputRef} onAddLesson={onAddLesson} />
        </div>
      </section>
    </div>
  )
}

function CourseHeader({
  document,
  authorName,
  onUpdateDocument,
}: {
  document: CourseDocument
  authorName: string
  onUpdateDocument: (updater: (document: CourseDocument) => CourseDocument) => void
}) {
  const metadata = document.metadata ?? {}
  return (
    <section className="fade-up fade-up-1 mt-6">
      <div className="flex items-center gap-3">
        <AuthorBadge name={String(metadata.authorName || authorName)} />
        <InlineText
          value={String(metadata.authorName || authorName)}
          className="text-sm font-bold uppercase text-[var(--lux-muted)]"
          onCommit={(value) =>
            onUpdateDocument((current) => ({
              ...current,
              metadata: { ...current.metadata, authorName: value || authorName },
            }))
          }
        />
        <ChevronDown size={15} className="text-[var(--lux-muted)]" />
      </div>

      <div className="mt-[60px] h-1.5 w-[200px] bg-[var(--lux-primary)]" />

      <DescriptionEditor
        value={document.description ?? ''}
        onCommit={(description) =>
          onUpdateDocument((current) => ({
            ...current,
            description,
            metadata: {
              ...current.metadata,
              scorm: {
                ...getScormSettings(current),
                lmsDescription: description,
              },
            },
          }))
        }
      />

      <div className="mt-7 hidden gap-3 rounded-lg bg-[var(--lux-surface-soft)] p-3 text-sm text-[var(--lux-muted)] sm:grid-cols-4">
        <MetadataField
          label="Audience"
          value={String(metadata.audience ?? '')}
          onCommit={(value) => onUpdateDocument((current) => ({ ...current, metadata: { ...current.metadata, audience: value } }))}
        />
        <MetadataField
          label="Duration"
          value={String(metadata.duration ?? '')}
          onCommit={(value) => onUpdateDocument((current) => ({ ...current, metadata: { ...current.metadata, duration: value } }))}
        />
        <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-[var(--lux-muted-soft)]">
          Format
          <select
            value={String(metadata.format ?? 'Linear')}
            onChange={(event) => onUpdateDocument((current) => ({ ...current, metadata: { ...current.metadata, format: event.target.value as CourseFormat } }))}
            className={selectClass}
          >
            {formatOptions.map((format) => <option key={format} value={format}>{format}</option>)}
          </select>
        </label>
        <MetadataField
          label="Tone"
          value={String(metadata.tone ?? '')}
          onCommit={(value) => onUpdateDocument((current) => ({ ...current, metadata: { ...current.metadata, tone: value } }))}
        />
      </div>
    </section>
  )
}

function MetadataField({
  label,
  value,
  onCommit,
}: {
  label: string
  value: string
  onCommit: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-[var(--lux-muted-soft)]">
      {label}
      <InlineText value={value} placeholder={label} className="normal-case tracking-normal" onCommit={onCommit} />
    </label>
  )
}

function AuthorBadge({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'A'

  return (
    <span className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-[var(--lux-primary)] text-base font-medium text-[var(--lux-text-strong)]">
      {initials}
    </span>
  )
}

function DescriptionEditor({
  value,
  onCommit,
}: {
  value: string
  onCommit: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing && !value.trim()) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="mt-24 block text-left font-serif text-2xl leading-9 text-[var(--lux-muted)] hover:text-[var(--lux-text)]"
      >
        Describe your course...
      </button>
    )
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className="mt-24 block max-w-3xl whitespace-pre-wrap text-left font-serif text-2xl leading-9 text-[var(--lux-muted)] hover:text-[var(--lux-text)]"
      >
        {value}
      </button>
    )
  }

  return (
    <textarea
      value={draft}
      autoFocus
      rows={3}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        onCommit(draft.trim())
        setEditing(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      }}
      className="mt-24 w-full max-w-3xl resize-none bg-transparent font-serif text-2xl leading-9 text-[var(--lux-text)] outline-none placeholder:text-[var(--lux-muted-soft)]"
      placeholder="Describe your course..."
    />
  )
}

function AddLessonInput({
  inputRef,
  onAddLesson,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  onAddLesson: (title: string) => boolean
}) {
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const commit = () => {
    if (!draft.trim()) {
      setError('Please enter a lesson title.')
      inputRef.current?.focus()
      return
    }
    if (onAddLesson(draft)) {
      setDraft('')
      setError('')
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
  }

  return (
    <div className="relative py-6">
      <div className="flex items-center gap-5">
        <span className="ml-5 text-2xl leading-none text-[var(--lux-muted-soft)]">•</span>
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value)
            setError('')
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') commit()
          }}
          placeholder="Add a lesson title..."
          className="min-w-0 flex-1 bg-transparent text-xl font-bold text-[var(--lux-muted)] outline-none placeholder:text-[var(--lux-muted-soft)]"
        />
        <button
          type="button"
          onClick={commit}
          className="hidden h-9 w-9 place-items-center rounded-full bg-[var(--lux-primary)] text-[var(--lux-text-strong)] shadow-sm hover:bg-[var(--lux-primary-hover)] sm:grid"
          aria-label="Confirm lesson title"
        >
          <Check size={15} />
        </button>
      </div>
      <p className="mt-3 text-right text-xs text-[var(--lux-muted)]">Shift + Enter to add as a section</p>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}

function LessonStructureItem({
  lesson,
  onUpdate,
  onRemove,
  onOpen,
  ...dragProps
}: {
  lesson: CourseLesson
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (event: DragEvent) => void
  onDrop?: () => void
  onUpdate: (updater: (lesson: CourseLesson) => CourseLesson) => void
  onRemove: () => void
  onOpen: () => void
}) {
  const [chooserOpen, setChooserOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hasContent = lesson.blocks.length > 0

  const handleAction = () => {
    if (hasContent) {
      onOpen()
      return
    }
    setChooserOpen((current) => !current)
  }

  return (
    <div className={cn('group relative py-7 transition-colors', chooserOpen && 'bg-[var(--lux-surface-soft)] px-5 sm:px-8')} {...dragProps}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <GripVertical className="hidden h-4 w-4 flex-shrink-0 cursor-grab text-[var(--lux-muted-soft)] opacity-0 transition group-hover:opacity-100 sm:block" />
          <span className="ml-5 text-2xl leading-none text-[var(--lux-muted-soft)] sm:ml-0">•</span>
          <InlineText
            value={lesson.title}
            className="min-w-0 text-xl font-bold text-[var(--lux-text-strong)]"
            onCommit={(title) => title.trim() && onUpdate((current) => ({ ...current, title: title.trim() }))}
          />
          {lesson.type === 'quiz' && <span className="rounded-full bg-[var(--lux-overlay)] px-2.5 py-1 text-xs font-bold text-[var(--lux-muted)]">Quiz</span>}
        </div>
        <div className="relative flex items-center gap-3 sm:justify-end">
          <button
            type="button"
            onClick={handleAction}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-[var(--lux-primary)] px-5 text-base font-bold text-[var(--lux-text-strong)] transition hover:bg-[var(--lux-primary-hover)]"
          >
            {hasContent ? 'Edit Content' : 'Add Content'}
            <ChevronDown size={18} className={cn(chooserOpen && 'rotate-180')} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!hasContent) onRemove()
              else setConfirmDelete(true)
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-[var(--lux-muted)] opacity-0 transition hover:bg-[var(--lux-overlay-hover)] hover:text-[var(--lux-text)] group-hover:opacity-100"
            aria-label="Delete lesson"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {chooserOpen && !hasContent && (
        <div className="relative ml-auto mt-5 w-full max-w-[625px] rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-6 shadow-[var(--lux-shadow)] before:absolute before:-top-3 before:right-24 before:h-6 before:w-6 before:rotate-45 before:border-l before:border-t before:border-[var(--lux-line)] before:bg-[var(--lux-surface)]">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => {
                onUpdate((current) => setLessonKind(current, 'lesson'))
                onOpen()
              }}
              className="flex w-full items-center justify-between rounded bg-[var(--lux-surface-soft)] px-8 py-6 text-left transition hover:bg-[var(--lux-elevated)]"
            >
              <span>
                <span className="block text-xl font-bold text-[var(--lux-text-strong)]">Create Lesson</span>
                <span className="mt-1 block text-lg text-[var(--lux-text)]">Create a new lesson from a wide range of learning blocks.</span>
              </span>
              <List size={28} />
            </button>
            <button
              type="button"
              onClick={() => {
                onUpdate((current) => setLessonKind(current, 'quiz'))
                onOpen()
              }}
              className="flex w-full items-center justify-between rounded bg-[var(--lux-surface-soft)] px-8 py-6 text-left transition hover:bg-[var(--lux-elevated)]"
            >
              <span>
                <span className="block text-xl font-bold text-[var(--lux-text-strong)]">Create Quiz</span>
                <span className="mt-1 block text-lg text-[var(--lux-text)]">Test the learner&apos;s knowledge with a quiz.</span>
              </span>
              <BookOpen size={28} />
            </button>
          </div>
          <button type="button" className="mx-auto mt-6 block text-lg text-[var(--lux-muted)] underline underline-offset-2">
            Lesson templates
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="flex-1">Delete this lesson and all its content?</span>
          <button type="button" onClick={onRemove} className="font-semibold text-red-700 hover:text-red-800">Yes, delete</button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold text-[var(--lux-muted)] hover:text-[var(--lux-text)]">Cancel</button>
        </div>
      )}
    </div>
  )
}

function LessonEditor({
  document,
  lesson,
  authorName,
  settingsOpen,
  onBack,
  onToggleSettings,
  onUpdateLesson,
}: {
  document: CourseDocument
  lesson: CourseLesson
  authorName: string
  settingsOpen: boolean
  onBack: () => void
  onToggleSettings: () => void
  onUpdateDocument: (updater: (document: CourseDocument) => CourseDocument) => void
  onUpdateLesson: (updater: (lesson: CourseLesson) => CourseLesson) => void
}) {
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)

  const updateBlock = (blockId: string, updater: (block: CourseBlock) => CourseBlock) => {
    onUpdateLesson((current) => ({
      ...current,
      blocks: current.blocks.map((block) => block.id === blockId ? updater(block) : block),
    }))
  }

  const insertBlock = (type: CourseBlockType) => {
    const block = createBlock(type)
    onUpdateLesson((current) => ({
      ...setLessonKind(current, lesson.type),
      blocks: [...current.blocks, block],
    }))
    setEditingBlockId(block.id)
    setLibraryOpen(false)
  }

  const moveBlock = (blockId: string, direction: -1 | 1) => {
    onUpdateLesson((current) => {
      const blocks = [...current.blocks]
      const index = blocks.findIndex((block) => block.id === blockId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return current
      const [block] = blocks.splice(index, 1)
      blocks.splice(nextIndex, 0, block)
      return { ...current, blocks }
    })
  }

  const reorderBlock = (targetBlockId: string) => {
    if (!draggedBlockId || draggedBlockId === targetBlockId) return
    onUpdateLesson((current) => {
      const blocks = [...current.blocks]
      const from = blocks.findIndex((block) => block.id === draggedBlockId)
      const to = blocks.findIndex((block) => block.id === targetBlockId)
      if (from < 0 || to < 0) return current
      const [block] = blocks.splice(from, 1)
      blocks.splice(to, 0, block)
      return { ...current, blocks }
    })
    setDraggedBlockId(null)
  }

  return (
    <main className="min-h-[calc(100vh-2.5rem)] bg-[var(--lux-bg)]">
      <div className="sticky top-10 z-30 flex h-14 items-center justify-between border-b border-[var(--lux-line)] bg-[var(--lux-surface)] px-3">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="grid h-11 w-11 place-items-center border-r border-[var(--lux-line)] text-[var(--lux-text)] hover:bg-[var(--lux-overlay-hover)]"
            aria-label="Back to course outline"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex max-w-[220px] items-center gap-2 rounded bg-[var(--lux-surface-soft)] px-6 py-2 text-base font-bold text-[var(--lux-text-strong)] hover:bg-[var(--lux-elevated)]"
          >
            <span className="truncate">{lesson.title}</span>
            <ChevronDown size={18} />
          </button>
        </div>
        <div className="flex items-center gap-3 pr-4 text-[var(--lux-text)]">
          <IconButton label="Undo" onClick={() => undefined}><Undo2 size={24} /></IconButton>
          <IconButton label="Redo" onClick={() => undefined}><Redo2 size={24} /></IconButton>
          <IconButton label="Settings" onClick={onToggleSettings}><SquareLibrary size={25} /></IconButton>
          <IconButton label="Comments" onClick={() => undefined}><MessageCircle size={25} /></IconButton>
          <ThemeToggle compact className="h-9 w-9 rounded-md" />
        </div>
      </div>

      <div className={cn('transition-[padding] duration-200', libraryOpen && 'lg:pl-[304px]')}>
        <section className="mx-auto max-w-[600px] px-5 pb-[122px] pt-16 sm:pt-20">
          <header>
            <InlineText
              value={lesson.title}
              className="text-[44px] font-bold leading-tight text-[var(--lux-text-strong)] sm:text-[52px]"
              onCommit={(title) => title.trim() && onUpdateLesson((current) => ({ ...current, title: title.trim() }))}
            />
            <div className="mt-7 flex items-center gap-3">
              <AuthorBadge name={String(lesson.metadata?.authorName ?? document.metadata?.authorName ?? authorName)} />
              <InlineText
                value={String(lesson.metadata?.authorName ?? document.metadata?.authorName ?? authorName)}
                className="text-sm font-bold uppercase text-[var(--lux-muted)]"
                onCommit={(value) => onUpdateLesson((current) => ({ ...current, metadata: { ...current.metadata, authorName: value || authorName } }))}
              />
              <ChevronDown size={15} className="text-[var(--lux-muted)]" />
            </div>
            <div className="mt-[76px] h-1.5 w-[200px] bg-[var(--lux-primary)]" />
          </header>

          {settingsOpen && lesson.type === 'quiz' && (
            <QuizSettingsPanel lesson={lesson} onUpdateLesson={onUpdateLesson} />
          )}
        </section>

        <section className="border-t-[3px] border-[var(--lux-line)] px-4 pb-12 pt-10">
          <div className="mx-auto max-w-[930px] space-y-4">
            {lesson.blocks.length === 0 && (
              <div className="mb-8 text-center">
                <p className="text-2xl font-semibold text-[var(--lux-text-strong)]">Add your first block</p>
                <span className="mx-auto mt-3 block h-px w-7 bg-[var(--lux-muted-soft)]" />
              </div>
            )}

            {lesson.blocks.map((block, index) => (
              <BlockItem
                key={block.id}
                block={block}
                index={index}
                total={lesson.blocks.length}
                editing={editingBlockId === block.id}
                onEdit={() => setEditingBlockId(block.id)}
                onDone={() => setEditingBlockId(null)}
                onUpdate={(updater) => updateBlock(block.id, updater)}
                onMoveUp={() => moveBlock(block.id, -1)}
                onMoveDown={() => moveBlock(block.id, 1)}
                onDuplicate={() => onUpdateLesson((current) => {
                  const blocks = [...current.blocks]
                  const blockIndex = blocks.findIndex((item) => item.id === block.id)
                  blocks.splice(blockIndex + 1, 0, duplicateBlock(block))
                  return { ...current, blocks }
                })}
                onDelete={() => onUpdateLesson((current) => ({ ...current, blocks: current.blocks.filter((item) => item.id !== block.id) }))}
                draggable
                onDragStart={() => setDraggedBlockId(block.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => reorderBlock(block.id)}
              />
            ))}

            <QuickInsertBar
              libraryOpen={libraryOpen}
              onToggleLibrary={() => setLibraryOpen((current) => !current)}
              onInsert={insertBlock}
            />
          </div>
        </section>
      </div>

      {libraryOpen && (
        <BlockLibraryRail
          quizMode={lesson.type === 'quiz'}
          onClose={() => setLibraryOpen(false)}
          onInsert={insertBlock}
        />
      )}
    </main>
  )
}

function QuizSettingsPanel({
  lesson,
  onUpdateLesson,
}: {
  lesson: CourseLesson
  onUpdateLesson: (updater: (lesson: CourseLesson) => CourseLesson) => void
}) {
  const quiz = lesson.quiz ?? { passingScore: 80, attempts: 1, showFeedback: true, randomizeQuestions: false, randomizeAnswers: false, questions: [] }
  const updateQuiz = (patch: Partial<typeof quiz>) => onUpdateLesson((current) => ({ ...current, quiz: { ...quiz, ...patch } }))

  return (
    <section className="mt-5 rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-4">
      <h2 className="text-sm font-semibold uppercase text-[var(--lux-muted-soft)]">Quiz Settings</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Field label="Passing score (%)">
          <input type="number" value={quiz.passingScore} onChange={(e) => updateQuiz({ passingScore: Number(e.target.value) })} className={inputClass} />
        </Field>
        <Field label="Question order">
          <select value={quiz.randomizeQuestions ? 'randomized' : 'fixed'} onChange={(e) => updateQuiz({ randomizeQuestions: e.target.value === 'randomized' })} className={selectClass}>
            <option value="fixed">Fixed</option>
            <option value="randomized">Randomized</option>
          </select>
        </Field>
        <Field label="Show feedback">
          <select value={String(lesson.metadata?.feedbackTiming ?? 'immediate')} onChange={(e) => onUpdateLesson((current) => ({ ...current, metadata: { ...current.metadata, feedbackTiming: e.target.value } }))} className={selectClass}>
            <option value="immediate">Immediately after each answer</option>
            <option value="end">At end of quiz</option>
            <option value="never">Never</option>
          </select>
        </Field>
        <Field label="Allow retry">
          <div className="grid grid-cols-[1fr_90px] gap-2">
            <select value={quiz.attempts && quiz.attempts > 1 ? 'max' : quiz.attempts === 0 ? 'no' : 'yes'} onChange={(e) => updateQuiz({ attempts: e.target.value === 'no' ? 0 : e.target.value === 'yes' ? 1 : 3 })} className={selectClass}>
              <option value="yes">Yes</option>
              <option value="no">No</option>
              <option value="max">Max attempts</option>
            </select>
            <input type="number" min={0} value={quiz.attempts ?? 1} onChange={(e) => updateQuiz({ attempts: Number(e.target.value) })} className={inputClass} />
          </div>
        </Field>
        <Field label="Time limit">
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <select value={quiz.timeLimitMinutes ? 'minutes' : 'none'} onChange={(e) => updateQuiz({ timeLimitMinutes: e.target.value === 'none' ? undefined : 10 })} className={selectClass}>
              <option value="none">None</option>
              <option value="minutes">Minutes</option>
            </select>
            <input type="number" value={quiz.timeLimitMinutes ?? ''} onChange={(e) => updateQuiz({ timeLimitMinutes: e.target.value ? Number(e.target.value) : undefined })} className={inputClass} />
          </div>
        </Field>
      </div>
    </section>
  )
}

function QuickInsertBar({
  libraryOpen,
  onToggleLibrary,
  onInsert,
}: {
  libraryOpen: boolean
  onToggleLibrary: () => void
  onInsert: (type: CourseBlockType) => void
}) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        onClick={onToggleLibrary}
        className={cn(
          'flex h-28 w-full shrink-0 flex-col items-center justify-center rounded bg-[var(--lux-primary)] px-3 text-center text-base font-bold leading-tight text-[var(--lux-text-strong)] transition hover:bg-[var(--lux-primary-hover)] sm:w-[75px]',
          libraryOpen && 'bg-[var(--lux-primary-hover)]',
        )}
      >
        <LibraryBig size={26} />
        <span className="mt-2">Block library</span>
      </button>
      <div className="grid flex-1 grid-cols-2 gap-1 rounded border border-dashed border-[var(--lux-line-strong)] bg-[var(--lux-surface)] px-5 py-5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        {quickInsertBlocks.map((block) => {
          const Icon = block.icon
          return (
            <button
              key={`${block.label}-${block.type}`}
              type="button"
              onClick={() => onInsert(block.type)}
              className="flex min-h-16 flex-col items-center justify-center gap-2 rounded px-2 text-center text-base text-[var(--lux-text)] transition hover:bg-[var(--lux-overlay-hover)]"
            >
              <Icon size={22} className={block.ai ? 'text-[var(--lux-gold)]' : 'text-[var(--lux-text)]'} />
              <span>{block.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function BlockLibraryRail({
  quizMode,
  onClose,
  onInsert,
}: {
  quizMode: boolean
  onClose: () => void
  onInsert: (type: CourseBlockType) => void
}) {
  const allowedQuizTypes: CourseBlockType[] = ['multiple_choice', 'multiple_select', 'true_false', 'fill_blank', 'matching', 'ordering', 'short_answer']
  const groups = blockLibraryGroups.filter((item) => {
    if (!quizMode) return item.type ? !getBlockDefinition(item.type).questionOnly : true
    return item.type ? allowedQuizTypes.includes(item.type) || item.ai : item.ai
  })

  return (
    <aside className="fixed bottom-0 left-0 top-10 z-40 w-[304px] border-r border-[var(--lux-line)] bg-[var(--lux-surface)] shadow-[var(--lux-shadow)]">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-10">
          <h2 className="text-xl font-bold text-[var(--lux-text-strong)]">Block library</h2>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--lux-overlay-hover)]" aria-label="Close block library">
            <X size={24} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="space-y-2">
            {groups.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => item.type && onInsert(item.type)}
                  className="flex w-full items-center gap-3 rounded px-4 py-2.5 text-left text-lg text-[var(--lux-text)] transition hover:bg-[var(--lux-overlay-hover)]"
                >
                  <Icon size={22} className={item.ai ? 'text-[var(--lux-gold)]' : 'text-[var(--lux-text)]'} />
                  <span className="min-w-0 flex-1">{item.label}</span>
                  {item.beta && <span className="rounded bg-[var(--lux-primary)] px-2 py-0.5 text-sm font-bold text-[var(--lux-text-strong)]">Beta</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </aside>
  )
}

function BlockItem({
  block,
  index,
  total,
  editing,
  onEdit,
  onDone,
  onUpdate,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  ...dragProps
}: {
  block: CourseBlock
  index: number
  total: number
  editing: boolean
  draggable?: boolean
  onDragStart?: () => void
  onDragOver?: (event: DragEvent) => void
  onDrop?: () => void
  onEdit: () => void
  onDone: () => void
  onUpdate: (updater: (block: CourseBlock) => CourseBlock) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const definition = getBlockDefinition(block.type)
  const Icon = definition.icon

  return (
    <article className={cn('group relative px-2 py-8 transition', editing && 'z-10')} {...dragProps}>
      <div className="absolute left-1/2 top-0 hidden -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-[var(--lux-line)] bg-[var(--lux-surface)] p-1 shadow-[0_2px_8px_rgba(0,0,0,0.12)] group-hover:flex">
        <IconButton label="Quick insert" onClick={onEdit}><X size={18} /></IconButton>
        <IconButton label="AI assist" onClick={onEdit}><Sparkles size={18} className="text-[var(--lux-gold)]" /></IconButton>
        <IconButton label="Table" onClick={onEdit}><Columns3 size={18} /></IconButton>
        <IconButton label="Numbered list" onClick={onEdit}><List size={18} /></IconButton>
        <IconButton label="Checklist" onClick={onEdit}><AlignLeft size={18} /></IconButton>
        <IconButton label="Math" onClick={onEdit}><span className="text-base font-bold">√x</span></IconButton>
      </div>
      <div className="absolute left-[-58px] top-8 hidden cursor-grab items-center gap-2 rounded bg-[var(--lux-surface)] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.12)] group-hover:flex">
        <GripVertical size={22} />
        <Icon size={22} />
        <Pencil size={22} />
        <Sparkles size={22} className="text-[var(--lux-gold)]" />
      </div>
      <div className="absolute right-[-64px] top-8 hidden items-center gap-2 rounded bg-[var(--lux-surface)] p-2 shadow-[0_12px_28px_rgba(0,0,0,0.12)] group-hover:flex">
        <IconButton label="Move up" disabled={index === 0} onClick={onMoveUp}><ChevronDown size={20} className="rotate-180" /></IconButton>
        <IconButton label="Move down" disabled={index === total - 1} onClick={onMoveDown}><ChevronDown size={20} /></IconButton>
        <IconButton label="Duplicate" onClick={onDuplicate}><Copy size={20} /></IconButton>
        <IconButton label="Delete" onClick={() => blockHasContent(block) ? setConfirmDelete(true) : onDelete()}><Trash2 size={20} /></IconButton>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mb-4 flex items-center gap-3 text-left"
      >
        <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--lux-primary)] text-[var(--lux-text-strong)]">
          {index + 1}
        </span>
        <div>
          <p className="text-xs font-bold uppercase text-[var(--lux-muted-soft)]">{categoryLabelFor(block.category)}</p>
          <p className="text-sm font-bold text-[var(--lux-text-strong)]">{block.title || definition.label}</p>
        </div>
      </button>

      <InlineBlockSurface
        block={block}
        editing={editing}
        onFocus={onEdit}
        onUpdate={onUpdate}
        onDone={onDone}
      />

      {confirmDelete && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <span className="flex-1">Delete this block?</span>
          <button type="button" onClick={onDelete} className="font-semibold text-red-700 hover:text-red-800">Yes</button>
          <button type="button" onClick={() => setConfirmDelete(false)} className="font-semibold text-[var(--lux-muted)] hover:text-[var(--lux-text)]">Cancel</button>
        </div>
      )}
    </article>
  )
}

function InlineBlockSurface({
  block,
  editing,
  onFocus,
  onUpdate,
  onDone,
}: {
  block: CourseBlock
  editing: boolean
  onFocus: () => void
  onUpdate: (updater: (block: CourseBlock) => CourseBlock) => void
  onDone: () => void
}) {
  const definition = getBlockDefinition(block.type)
  const metadata = block.metadata ?? {}
  const items = block.items ?? []
  const update = (patch: Partial<CourseBlock>) => onUpdate((current) => ({ ...current, ...patch }))
  const updateMetadata = (key: string, value: unknown) => {
    onUpdate((current) => ({ ...current, metadata: { ...current.metadata, [key]: value } }))
  }
  const updateItems = (nextItems: CourseInteractionItem[]) => update({ items: nextItems })
  const updateItem = (id: string, patch: Partial<CourseInteractionItem>) => {
    updateItems(items.map((item) => item.id === id ? { ...item, ...patch } : item))
  }
  const addItem = (patch: Partial<CourseInteractionItem> = {}) => {
    updateItems([...items, { id: uid('item'), title: '', content: '', ...patch }])
  }
  const removeItem = (id: string) => updateItems(items.filter((item) => item.id !== id))
  const meta = (key: string, fallback = '') => String(metadata[key] ?? fallback)

  const doneControl = editing ? (
    <div className="mt-4 flex justify-end">
      <Button size="sm" onClick={onDone}>
        <Check size={14} className="mr-1" />
        Done
      </Button>
    </div>
  ) : null

  return (
    <div
      className={cn(
        'rounded-lg border border-transparent px-4 py-4 transition',
        editing && 'border-[var(--lux-line)] bg-[var(--lux-surface-soft)] shadow-[var(--lux-shadow)]',
      )}
      onFocusCapture={onFocus}
      onClick={onFocus}
    >
      {(() => {
        if (block.type === 'heading') {
          return (
            <div className="space-y-2">
              <select
                value={meta('level', 'H2')}
                onChange={(event) => updateMetadata('level', event.target.value)}
                className={cn(selectClass, 'w-28')}
              >
                <option value="H1">H1</option>
                <option value="H2">H2</option>
                <option value="H3">H3</option>
              </select>
              <input
                value={block.title ?? ''}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="Heading"
                className={cn(ghostInputClass, 'text-3xl font-bold leading-tight text-[var(--lux-text-strong)]')}
              />
              <input
                value={meta('subtitle')}
                onChange={(event) => updateMetadata('subtitle', event.target.value)}
                placeholder="Subtitle"
                className={cn(ghostInputClass, 'text-lg text-[var(--lux-muted)]')}
              />
            </div>
          )
        }

        if (block.type === 'text' || block.type === 'paragraph') {
          return (
            <div className="space-y-3">
              <input
                value={block.title ?? ''}
                onChange={(event) => update({ title: event.target.value })}
                placeholder="Heading"
                className={cn(ghostInputClass, 'text-2xl font-bold text-[var(--lux-text-strong)]')}
              />
              <textarea
                value={block.content ?? ''}
                onChange={(event) => update({ content: event.target.value })}
                rows={5}
                placeholder="Start writing..."
                className={cn(ghostInputClass, 'resize-none font-serif text-2xl leading-9')}
              />
            </div>
          )
        }

        if (block.type === 'callout' || block.type === 'statement') {
          return (
            <div className="rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-5">
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <select
                  value={meta('style', block.type === 'statement' ? 'Statement' : 'Info')}
                  onChange={(event) => updateMetadata('style', event.target.value)}
                  className={selectClass}
                >
                  {['Info', 'Warning', 'Tip', 'Note', 'Statement'].map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
                <input
                  value={block.title ?? ''}
                  onChange={(event) => update({ title: event.target.value })}
                  placeholder={definition.label}
                  className={cn(ghostInputClass, 'min-w-[180px] flex-1 text-lg font-bold text-[var(--lux-text-strong)]')}
                />
              </div>
              <textarea
                value={block.content ?? ''}
                onChange={(event) => update({ content: event.target.value })}
                rows={3}
                placeholder="Add emphasis text..."
                className={cn(inlineSurfaceTextareaClass, 'text-xl font-semibold leading-8')}
              />
            </div>
          )
        }

        if (block.type === 'quote') {
          return (
            <figure className="border-l-4 border-[var(--lux-primary)] pl-6">
              <textarea
                value={block.content ?? ''}
                onChange={(event) => update({ content: event.target.value })}
                rows={3}
                placeholder="Add quote..."
                className={cn(ghostInputClass, 'resize-none font-serif text-3xl leading-tight text-[var(--lux-text-strong)]')}
              />
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr]">
                <input value={meta('attributionName')} onChange={(event) => updateMetadata('attributionName', event.target.value)} placeholder="Attribution" className={inlineSurfaceInputClass} />
                <input value={meta('attributionRole')} onChange={(event) => updateMetadata('attributionRole', event.target.value)} placeholder="Role or source" className={inlineSurfaceInputClass} />
              </div>
            </figure>
          )
        }

        if (['numbered_list', 'list', 'checklist', 'ordering', 'process_steps', 'timeline', 'lesson_summary'].includes(block.type)) {
          const ordered = ['numbered_list', 'ordering', 'process_steps', 'timeline'].includes(block.type)
          return (
            <div className="space-y-5">
              <input
                value={block.title ?? ''}
                onChange={(event) => update({ title: event.target.value })}
                placeholder={definition.label}
                className={cn(ghostInputClass, 'text-2xl font-bold text-[var(--lux-text-strong)]')}
              />
              <div className="space-y-4">
                {items.map((item, itemIndex) => (
                  <div key={item.id} className="grid gap-4 sm:grid-cols-[4rem_1fr_auto]">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--lux-primary)] text-lg font-bold text-[var(--lux-text-strong)]">
                      {ordered ? itemIndex + 1 : <Check size={20} />}
                    </span>
                    <div className="space-y-2">
                      <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder={`Item ${itemIndex + 1}`} className={cn(inlineSurfaceInputClass, 'text-lg font-semibold')} />
                      <textarea value={item.content ?? ''} onChange={(event) => updateItem(item.id, { content: event.target.value })} rows={2} placeholder="Detail" className={inlineSurfaceTextareaClass} />
                    </div>
                    <IconButton label="Remove item" onClick={() => removeItem(item.id)}><Trash2 size={16} /></IconButton>
                  </div>
                ))}
              </div>
              <InlineAddButton onClick={() => addItem()}>Add item</InlineAddButton>
            </div>
          )
        }

        if (block.type === 'divider' || block.type === 'spacer') {
          return (
            <div className="py-4">
              <div className="flex items-center gap-4">
                <span className="h-px flex-1 bg-[var(--lux-line)]" />
                <input
                  value={meta('label')}
                  onChange={(event) => updateMetadata('label', event.target.value)}
                  placeholder={block.type === 'spacer' ? 'Spacer' : 'Divider'}
                  className="w-40 bg-transparent text-center text-xs font-bold uppercase text-[var(--lux-muted)] outline-none placeholder:text-[var(--lux-muted-soft)]"
                />
                <span className="h-px flex-1 bg-[var(--lux-line)]" />
              </div>
            </div>
          )
        }

        if (['image', 'video', 'audio', 'embed', 'attachment', 'document', 'file_download', 'resource_link'].includes(block.type)) {
          const isImage = block.type === 'image'
          const isVideo = block.type === 'video'
          const isAudio = block.type === 'audio'
          return (
            <div className="space-y-4">
              <input value={block.title ?? ''} onChange={(event) => update({ title: event.target.value })} placeholder={definition.label} className={cn(ghostInputClass, 'text-xl font-bold text-[var(--lux-text-strong)]')} />
              <div className="rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-5">
                {isImage && block.assetUrl ? (
                  <img src={block.assetUrl} alt={meta('alt')} className="max-h-[420px] w-full rounded object-cover" />
                ) : isVideo && block.assetUrl ? (
                  <video controls src={block.assetUrl} className="w-full rounded" />
                ) : isAudio && block.assetUrl ? (
                  <audio controls src={block.assetUrl} className="w-full" />
                ) : block.assetUrl && block.type === 'embed' ? (
                  <div className="aspect-video rounded border border-[var(--lux-line)] bg-[var(--lux-surface-soft)] p-4 text-sm text-[var(--lux-muted)]">{block.assetUrl}</div>
                ) : (
                  <div className="grid min-h-40 place-items-center rounded border border-dashed border-[var(--lux-line)] bg-[var(--lux-surface-soft)] text-center text-sm text-[var(--lux-muted)]">
                    <div>
                      {isImage ? <ImageIcon className="mx-auto mb-2" size={28} /> : isVideo ? <Video className="mx-auto mb-2" size={28} /> : <Download className="mx-auto mb-2" size={28} />}
                      Add media URL below
                    </div>
                  </div>
                )}
                <input value={block.assetUrl ?? ''} onChange={(event) => update({ assetUrl: event.target.value })} placeholder="Media, file, or embed URL" className={cn(inputClass, 'mt-4 w-full')} />
              </div>
              <input value={meta('caption', meta('label'))} onChange={(event) => updateMetadata(block.type === 'file_download' ? 'label' : 'caption', event.target.value)} placeholder="Caption or display label" className={inlineSurfaceInputClass} />
            </div>
          )
        }

        if (block.type === 'image_gallery' || block.type === 'gallery') {
          return (
            <div className="space-y-4">
              <input value={block.title ?? ''} onChange={(event) => update({ title: event.target.value })} placeholder="Gallery title" className={cn(ghostInputClass, 'text-2xl font-bold text-[var(--lux-text-strong)]')} />
              <div className="grid gap-3 sm:grid-cols-2">
                {items.map((item, itemIndex) => (
                  <div key={item.id} className="rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-3">
                    {item.mediaUrl ? <img src={item.mediaUrl} alt="" className="aspect-video w-full rounded object-cover" /> : <div className="grid aspect-video place-items-center rounded bg-[var(--lux-surface-soft)] text-sm text-[var(--lux-muted)]">Image {itemIndex + 1}</div>}
                    <input value={item.mediaUrl ?? ''} onChange={(event) => updateItem(item.id, { mediaUrl: event.target.value })} placeholder="Image URL" className={cn(inlineSurfaceInputClass, 'mt-2')} />
                    <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder="Caption" className={cn(inlineSurfaceInputClass, 'mt-1')} />
                    <button type="button" onClick={() => removeItem(item.id)} className="mt-2 text-xs font-semibold text-[var(--lux-muted)] hover:text-red-400">Remove</button>
                  </div>
                ))}
              </div>
              <InlineAddButton onClick={() => addItem({ mediaUrl: '' })}>Add image</InlineAddButton>
            </div>
          )
        }

        if (['accordion', 'tabs', 'flashcards', 'reveal', 'sorting_activity', 'sorting', 'matching', 'dialogue', 'branching_dialogue', 'choice_point', 'consequence', 'decision_recap', 'branch_merge', 'conditional_gate', 'character_monologue', 'before_after', 'hotspot', 'labeled_graphic', 'scenario'].includes(block.type)) {
          return (
            <div className="space-y-4">
              <input value={block.title ?? ''} onChange={(event) => update({ title: event.target.value })} placeholder={definition.label} className={cn(ghostInputClass, 'text-2xl font-bold text-[var(--lux-text-strong)]')} />
              <textarea value={block.content ?? ''} onChange={(event) => update({ content: event.target.value })} rows={3} placeholder="Prompt or intro" className={inlineSurfaceTextareaClass} />
              <div className={cn('grid gap-3', block.type === 'flashcards' && 'sm:grid-cols-2')}>
                {items.map((item, itemIndex) => (
                  <div key={item.id} className="rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-4">
                    <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase text-[var(--lux-muted-soft)]">
                      <span>{block.type === 'flashcards' ? 'Card' : 'Panel'} {itemIndex + 1}</span>
                      <IconButton label="Remove" onClick={() => removeItem(item.id)}><Trash2 size={14} /></IconButton>
                    </div>
                    <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder="Title" className={cn(inlineSurfaceInputClass, 'font-semibold')} />
                    <textarea value={item.content ?? ''} onChange={(event) => updateItem(item.id, { content: event.target.value })} rows={3} placeholder={block.type === 'matching' || block.type === 'sorting_activity' ? 'Category or response' : 'Content'} className={cn(inlineSurfaceTextareaClass, 'mt-2')} />
                    {['matching', 'sorting_activity', 'sorting'].includes(block.type) && (
                      <input value={item.match ?? ''} onChange={(event) => updateItem(item.id, { match: event.target.value })} placeholder="Match or category" className={cn(inlineSurfaceInputClass, 'mt-2')} />
                    )}
                  </div>
                ))}
              </div>
              <InlineAddButton onClick={() => addItem()}>Add panel</InlineAddButton>
            </div>
          )
        }

        if (isQuestionBlock(block.type) || block.type === 'knowledge_check') {
          return (
            <div className="space-y-4 rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-5">
              <input value={block.title ?? ''} onChange={(event) => update({ title: event.target.value })} placeholder="Question" className={cn(ghostInputClass, 'text-2xl font-bold text-[var(--lux-text-strong)]')} />
              <textarea value={block.content ?? ''} onChange={(event) => update({ content: event.target.value })} rows={2} placeholder="Optional instructions" className={inlineSurfaceTextareaClass} />
              <div className="space-y-2">
                {items.map((item, itemIndex) => (
                  <div key={item.id} className="grid gap-2 rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface-soft)] p-2 sm:grid-cols-[auto_1fr_auto]">
                    <label className="flex items-center gap-2 text-xs font-semibold text-[var(--lux-muted)]">
                      <input
                        type={block.type === 'multiple_select' ? 'checkbox' : 'radio'}
                        name={`correct-${block.id}`}
                        checked={item.content === 'true'}
                        onChange={(event) => updateItem(item.id, { content: event.target.checked ? 'true' : 'false' })}
                      />
                      Correct
                    </label>
                    <input value={item.title} onChange={(event) => updateItem(item.id, { title: event.target.value })} placeholder={`Answer ${itemIndex + 1}`} className={inlineSurfaceInputClass} />
                    <IconButton label="Remove answer" onClick={() => removeItem(item.id)}><Trash2 size={14} /></IconButton>
                  </div>
                ))}
              </div>
              <InlineAddButton onClick={() => addItem({ content: 'false' })}>Add answer</InlineAddButton>
              <QuestionCommonSettings block={block} onChange={updateMetadata} />
            </div>
          )
        }

        if (block.type === 'table') {
          return (
            <div className="space-y-4">
              <input value={block.title ?? ''} onChange={(event) => update({ title: event.target.value })} placeholder="Table title" className={cn(ghostInputClass, 'text-2xl font-bold text-[var(--lux-text-strong)]')} />
              <textarea value={block.content ?? ''} onChange={(event) => update({ content: event.target.value })} rows={5} placeholder="Paste table rows as CSV or tab-separated text" className={cn(textareaClass, 'font-mono')} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Rows"><input type="number" value={Number(metadata.rows ?? 3)} onChange={(event) => updateMetadata('rows', Number(event.target.value))} className={inputClass} /></Field>
                <Field label="Columns"><input type="number" value={Number(metadata.columns ?? 3)} onChange={(event) => updateMetadata('columns', Number(event.target.value))} className={inputClass} /></Field>
                <label className="flex items-end gap-2 pb-2 text-sm text-[var(--lux-muted)]"><input type="checkbox" checked={Boolean(metadata.headerRow ?? true)} onChange={(event) => updateMetadata('headerRow', event.target.checked)} /> Header row</label>
              </div>
            </div>
          )
        }

        if (block.type === 'chart') {
          return (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <input value={meta('chartTitle', block.title ?? '')} onChange={(event) => updateMetadata('chartTitle', event.target.value)} placeholder="Chart title" className={cn(inlineSurfaceInputClass, 'min-w-[240px] flex-1 text-xl font-bold')} />
                <select value={meta('chartType', 'bar')} onChange={(event) => updateMetadata('chartType', event.target.value)} className={selectClass}>
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                  <option value="pie">Pie</option>
                </select>
              </div>
              <div className="flex h-44 items-end gap-3 rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-4">
                {[62, 88, 45, 70, 54].map((height, barIndex) => (
                  <span key={barIndex} className="flex-1 rounded-t bg-[var(--lux-primary)]/80" style={{ height: `${height}%` }} />
                ))}
              </div>
              <textarea value={meta('data')} onChange={(event) => updateMetadata('data', event.target.value)} rows={3} placeholder="Data values" className={textareaClass} />
            </div>
          )
        }

        if (block.type === 'code') {
          return (
            <div className="space-y-3">
              <input value={block.title ?? ''} onChange={(event) => update({ title: event.target.value })} placeholder="Code title" className={cn(ghostInputClass, 'text-xl font-bold text-[var(--lux-text-strong)]')} />
              <textarea value={block.content ?? ''} onChange={(event) => update({ content: event.target.value })} rows={8} placeholder="Paste code..." className={cn(textareaClass, 'font-mono')} />
            </div>
          )
        }

        if (['continue_button', 'button', 'restart_button'].includes(block.type)) {
          return (
            <div className="flex flex-col items-center gap-4 py-6">
              <input value={meta('label', block.content || block.title || definition.label)} onChange={(event) => updateMetadata('label', event.target.value)} className="w-full max-w-xs rounded-full bg-[var(--lux-primary)] px-6 py-3 text-center text-base font-bold text-[var(--lux-text-strong)] outline-none placeholder:text-[var(--lux-text-strong)]/70" />
              <input value={block.assetUrl ?? ''} onChange={(event) => update({ assetUrl: event.target.value })} placeholder="Optional destination URL" className={cn(inputClass, 'max-w-md')} />
            </div>
          )
        }

        return (
          <div className="space-y-3">
            <input value={block.title ?? ''} onChange={(event) => update({ title: event.target.value })} placeholder={definition.label} className={cn(ghostInputClass, 'text-2xl font-bold text-[var(--lux-text-strong)]')} />
            <textarea value={block.content ?? ''} onChange={(event) => update({ content: event.target.value })} rows={4} placeholder={definition.description} className={inlineSurfaceTextareaClass} />
            <MetadataFields block={block} onChange={updateMetadata} />
            {items.length > 0 && <ItemsEditor block={block} onUpdateItems={updateItems} />}
          </div>
        )
      })()}
      {doneControl}
    </div>
  )
}

function InlineAddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--lux-primary-muted)] hover:text-[var(--lux-primary)]"
    >
      <Plus size={14} />
      {children}
    </button>
  )
}

function MetadataFields({
  block,
  onChange,
}: {
  block: CourseBlock
  onChange: (key: string, value: unknown) => void
}) {
  const metadata = block.metadata ?? {}
  const fields: Array<{ key: string; label: string; type?: 'text' | 'number' | 'boolean' | 'select'; options?: string[] }> = []

  if (block.type === 'heading') fields.push({ key: 'subtitle', label: 'Subtitle' }, { key: 'level', label: 'Level', type: 'select', options: ['H1', 'H2', 'H3'] })
  if (block.type === 'callout') fields.push({ key: 'style', label: 'Style', type: 'select', options: ['Info', 'Warning', 'Tip', 'Note'] })
  if (block.type === 'quote') fields.push({ key: 'attributionName', label: 'Attribution name' }, { key: 'attributionRole', label: 'Attribution role' }, { key: 'avatarUrl', label: 'Avatar URL' })
  if (block.type === 'divider') fields.push({ key: 'label', label: 'Label' }, { key: 'style', label: 'Style', type: 'select', options: ['solid', 'dashed', 'dotted'] })
  if (block.type === 'image') fields.push({ key: 'caption', label: 'Caption' }, { key: 'alt', label: 'Alt text' }, { key: 'width', label: 'Width', type: 'select', options: ['small', 'medium', 'full'] })
  if (block.type === 'image_gallery') fields.push({ key: 'layout', label: 'Layout', type: 'select', options: ['2-col grid', '3-col grid', 'carousel'] })
  if (block.type === 'video') fields.push({ key: 'autoplay', label: 'Autoplay', type: 'boolean' }, { key: 'caption', label: 'Caption' })
  if (block.type === 'audio') fields.push({ key: 'transcript', label: 'Transcript' })
  if (block.type === 'embed') fields.push({ key: 'height', label: 'Height', type: 'number' }, { key: 'iframe', label: 'iFrame code' })
  if (block.type === 'dialogue' || block.type === 'branching_dialogue') fields.push({ key: 'bubbleStyle', label: 'Speech bubble style', type: 'select', options: ['Chat', 'Screenplay', 'Comic Strip'] })
  if (block.type === 'character_monologue') fields.push({ key: 'characterName', label: 'Character name' }, { key: 'avatarUrl', label: 'Avatar URL' }, { key: 'emotion', label: 'Emotion', type: 'select', options: ['happy', 'neutral', 'concerned', 'angry', 'surprised'] }, { key: 'alignment', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] })
  if (block.type === 'fill_blank') fields.push({ key: 'acceptedAnswers', label: 'Accepted answers' }, { key: 'caseSensitive', label: 'Case sensitive', type: 'boolean' })
  if (block.type === 'true_false') fields.push({ key: 'correctAnswer', label: 'Correct answer', type: 'select', options: ['True', 'False'] }, { key: 'explanation', label: 'Explanation' })
  if (block.type === 'hotspot') fields.push({ key: 'imageUrl', label: 'Image URL' }, { key: 'regions', label: 'Hotspot regions' })
  if (block.type === 'short_answer') fields.push({ key: 'keywords', label: 'Keyword list' }, { key: 'manualReview', label: 'Manual review', type: 'boolean' })
  if (block.type === 'likert') fields.push({ key: 'scaleSize', label: 'Scale size', type: 'select', options: ['5', '7'] }, { key: 'lowLabel', label: 'Low label' }, { key: 'highLabel', label: 'High label' })
  if (block.type === 'rating_slider') fields.push({ key: 'min', label: 'Min', type: 'number' }, { key: 'max', label: 'Max', type: 'number' }, { key: 'step', label: 'Step', type: 'number' }, { key: 'minLabel', label: 'Min label' }, { key: 'maxLabel', label: 'Max label' })
  if (block.type === 'conditional_gate') fields.push({ key: 'conditionType', label: 'Condition type', type: 'select', options: ['passed quiz', 'viewed lesson', 'answered question correctly'] }, { key: 'target', label: 'Target lesson or quiz' }, { key: 'lockedMessage', label: 'Locked message' })
  if (block.type === 'timeline') fields.push({ key: 'orientation', label: 'Orientation', type: 'select', options: ['horizontal', 'vertical'] })
  if (block.type === 'checklist') fields.push({ key: 'showProgress', label: 'Show progress', type: 'boolean' })
  if (block.type === 'reveal') fields.push({ key: 'triggerLabel', label: 'Trigger label' }, { key: 'hiddenContent', label: 'Hidden content' })
  if (block.type === 'sorting_activity') fields.push({ key: 'graded', label: 'Graded', type: 'boolean' })
  if (block.type === 'before_after') fields.push({ key: 'beforeImage', label: 'Before image' }, { key: 'afterImage', label: 'After image' }, { key: 'beforeLabel', label: 'Before label' }, { key: 'afterLabel', label: 'After label' })
  if (block.type === 'table') fields.push({ key: 'rows', label: 'Rows', type: 'number' }, { key: 'columns', label: 'Columns', type: 'number' }, { key: 'headerRow', label: 'Header row', type: 'boolean' })
  if (block.type === 'chart') fields.push({ key: 'chartType', label: 'Chart type', type: 'select', options: ['bar', 'line', 'pie'] }, { key: 'data', label: 'Data' }, { key: 'axisLabels', label: 'Axis labels' }, { key: 'chartTitle', label: 'Chart title' })
  if (block.type === 'resource_link') fields.push({ key: 'url', label: 'URL' }, { key: 'icon', label: 'Icon' })
  if (block.type === 'file_download') fields.push({ key: 'fileUrl', label: 'File URL' }, { key: 'label', label: 'Display label' }, { key: 'description', label: 'Description' })
  if (block.type === 'glossary') fields.push({ key: 'term', label: 'Term' }, { key: 'definition', label: 'Definition' }, { key: 'example', label: 'Example sentence' })
  if (block.type === 'continue_button') fields.push({ key: 'label', label: 'Button label' }, { key: 'alignment', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] })
  if (block.type === 'score_summary') fields.push({ key: 'sourceQuiz', label: 'Source quiz' }, { key: 'passMessage', label: 'Pass message' }, { key: 'failMessage', label: 'Fail message' })
  if (block.type === 'certificate') fields.push({ key: 'logoUrl', label: 'Logo URL' }, { key: 'signatureUrl', label: 'Signature URL' })
  if (block.type === 'completion_message') fields.push({ key: 'imageUrl', label: 'Optional image' })
  if (block.type === 'restart_button') fields.push({ key: 'label', label: 'Button label' }, { key: 'scope', label: 'Scope', type: 'select', options: ['entire course', 'current lesson only'] })

  if (!fields.length) return null

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {fields.map((field) => (
        <Field key={field.key} label={field.label}>
          {field.type === 'boolean' ? (
            <label className="inline-flex h-10 items-center gap-2 text-sm text-[var(--lux-muted)]">
              <input type="checkbox" checked={Boolean(metadata[field.key])} onChange={(e) => onChange(field.key, e.target.checked)} />
              Enabled
            </label>
          ) : field.type === 'select' ? (
            <select value={String(metadata[field.key] ?? field.options?.[0] ?? '')} onChange={(e) => onChange(field.key, e.target.value)} className={selectClass}>
              {(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          ) : (
            <input
              type={field.type === 'number' ? 'number' : 'text'}
              value={String(metadata[field.key] ?? '')}
              onChange={(e) => onChange(field.key, field.type === 'number' ? Number(e.target.value) : e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
      ))}
    </div>
  )
}

function ItemsEditor({
  block,
  onUpdateItems,
}: {
  block: CourseBlock
  onUpdateItems: (items: CourseInteractionItem[]) => void
}) {
  const items = block.items ?? []
  const updateItem = (id: string, patch: Partial<CourseInteractionItem>) => {
    onUpdateItems(items.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  return (
    <Field label={isQuestionBlock(block.type) ? 'Answer options / pairs' : 'Items'}>
      <div className="space-y-2">
        {items.map((item, index) => (
              <div key={item.id} className="grid gap-2 rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface-soft)] p-2 sm:grid-cols-[1fr_1fr_auto]">
            <input value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })} placeholder={`Item ${index + 1}`} className={inputClass} />
            <input value={item.match ?? item.content ?? ''} onChange={(e) => updateItem(item.id, isQuestionBlock(block.type) || block.type === 'matching' ? { content: e.target.value } : { content: e.target.value })} placeholder={block.type === 'matching' ? 'Match' : 'Detail'} className={inputClass} />
            <button type="button" onClick={() => onUpdateItems(items.filter((next) => next.id !== item.id))} className="grid h-10 w-10 place-items-center rounded-lg text-[var(--lux-muted-soft)] hover:bg-red-500/10 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => onUpdateItems([...items, { id: uid('item'), title: '', content: '' }])}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--lux-primary-muted)]"
        >
          <Plus size={14} />
          Add item
        </button>
      </div>
    </Field>
  )
}

function QuestionCommonSettings({
  block,
  onChange,
}: {
  block: CourseBlock
  onChange: (key: string, value: unknown) => void
}) {
  const metadata = block.metadata ?? {}
  return (
    <div className="rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface-soft)] p-3">
      <p className="text-xs font-semibold uppercase text-[var(--lux-muted-soft)]">Question Settings</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <Field label="Points"><input type="number" value={Number(metadata.points ?? 1)} onChange={(e) => onChange('points', Number(e.target.value))} className={inputClass} /></Field>
        <Field label="Max attempts"><input type="number" value={Number(metadata.maxAttempts ?? 1)} onChange={(e) => onChange('maxAttempts', Number(e.target.value))} className={inputClass} /></Field>
        <Field label="Hint"><input value={String(metadata.hint ?? '')} onChange={(e) => onChange('hint', e.target.value)} className={inputClass} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm text-[var(--lux-muted)]">
        <label><input type="checkbox" checked={Boolean(metadata.allowRetry)} onChange={(e) => onChange('allowRetry', e.target.checked)} /> Allow retry</label>
        <label><input type="checkbox" checked={Boolean(metadata.shuffle)} onChange={(e) => onChange('shuffle', e.target.checked)} /> Shuffle options</label>
        <label><input type="checkbox" checked={Boolean(metadata.required)} onChange={(e) => onChange('required', e.target.checked)} /> Required</label>
      </div>
    </div>
  )
}

function ScormPanel({
  document,
  scenarioId,
  manifestOpen,
  onToggleManifest,
  onUpdateDocument,
}: {
  document: CourseDocument
  scenarioId?: string
  manifestOpen: boolean
  onToggleManifest: () => void
  onUpdateDocument: (updater: (document: CourseDocument) => CourseDocument) => void
}) {
  const [exporting, setExporting] = useState(false)
  const scorm = getScormSettings(document)
  const updateScorm = (patch: Partial<ScormSettings>) => {
    onUpdateDocument((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        scorm: {
          ...getScormSettings(current),
          ...patch,
        } as unknown as Record<string, unknown>,
      },
      settings: {
        ...current.settings,
        passingScore: patch.passingScore ?? current.settings.passingScore,
        scormVersion: patch.version === 'scorm_2004_3rd' ? '2004' : patch.version === 'scorm_1_2' ? '1.2' : current.settings.scormVersion,
      },
    }))
  }

  const exportZip = async () => {
    if (!scenarioId) return
    setExporting(true)
    try {
      const response = await scormApi.export(scenarioId)
      const url = window.URL.createObjectURL(response.data)
      const link = window.document.createElement('a')
      link.href = url
      link.download = `${scorm.courseIdentifier || 'course'}.zip`
      link.click()
      window.URL.revokeObjectURL(url)
    } catch {
      toast.error('SCORM export failed')
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="rounded-lg border border-[var(--lux-line)] bg-[var(--lux-surface)] p-4">
      <h2 className="text-sm font-semibold uppercase text-[var(--lux-muted-soft)]">SCORM Export Configuration</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <RadioGroup label="SCORM Version" value={scorm.version} options={[['scorm_1_2', 'SCORM 1.2'], ['scorm_2004_3rd', 'SCORM 2004 3rd Ed.'], ['xapi', 'xAPI Tin Can']]} onChange={(value) => updateScorm({ version: value as ScormSettings['version'] })} />
        <RadioGroup label="Completion Trigger" value={scorm.completionTrigger} options={[['viewed_all', 'Learner has viewed all lessons'], ['passed_assessment', 'Learner has passed the assessment'], ['completion_page', 'Learner has reached the completion page'], ['custom', 'Custom condition']]} onChange={(value) => updateScorm({ completionTrigger: value as ScormSettings['completionTrigger'] })} />
        {scorm.completionTrigger === 'custom' && <Field label="Custom condition"><input value={scorm.customCondition} onChange={(e) => updateScorm({ customCondition: e.target.value })} className={inputClass} /></Field>}
        <Field label="Passing Score (%)"><input type="number" value={scorm.passingScore} onChange={(e) => updateScorm({ passingScore: Number(e.target.value) })} className={inputClass} /></Field>
        <Field label="Maximum Score (points)"><input type="number" value={scorm.maxScore} onChange={(e) => updateScorm({ maxScore: Number(e.target.value) })} className={inputClass} /></Field>
        <Field label="Course Identifier"><input value={scorm.courseIdentifier} onChange={(e) => updateScorm({ courseIdentifier: e.target.value })} className={inputClass} /></Field>
        <Field label="Course Title for LMS"><input value={scorm.lmsTitle} onChange={(e) => updateScorm({ lmsTitle: e.target.value })} className={inputClass} /></Field>
        <Field label="Language">
          <select value={scorm.language} onChange={(e) => updateScorm({ language: e.target.value })} className={selectClass}>
            <option value="en-US">en-US</option>
            <option value="fr-FR">fr-FR</option>
            <option value="ar-TN">ar-TN</option>
          </select>
        </Field>
        <RadioGroup label="Launch Behavior" value={scorm.launchBehavior} options={[['new_window', 'new window'], ['same_window', 'same window']]} onChange={(value) => updateScorm({ launchBehavior: value as ScormSettings['launchBehavior'] })} />
        {scorm.version === 'scorm_2004_3rd' && <Field label="Mastery Score"><input type="number" value={scorm.masteryScore} onChange={(e) => updateScorm({ masteryScore: Number(e.target.value) })} className={inputClass} /></Field>}
      </div>
      <Field label="Course Description for LMS">
        <textarea value={scorm.lmsDescription} onChange={(e) => updateScorm({ lmsDescription: e.target.value })} rows={3} className={textareaClass} />
      </Field>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={exportZip} loading={exporting} disabled={!scenarioId}>Export as SCORM .zip</Button>
        <Button size="sm" variant="secondary" onClick={onToggleManifest}>Preview imsmanifest.xml</Button>
      </div>
      {manifestOpen && (
        <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-[var(--lux-line)] bg-black/30 p-4 text-xs leading-5 text-[var(--lux-text)]">
          {createManifestPreview(document)}
        </pre>
      )}
    </section>
  )
}

function InlineText({
  value,
  prefix = '',
  placeholder = '',
  className,
  onCommit,
}: {
  value: string
  prefix?: string
  placeholder?: string
  className?: string
  onCommit: (value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value)
          setEditing(true)
        }}
        className={cn('text-left', className)}
      >
        {prefix}{value || placeholder || 'Add value'}
      </button>
    )
  }

  return (
    <input
      value={draft}
      autoFocus
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        onCommit(draft)
        setEditing(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          onCommit(draft)
          setEditing(false)
        }
        if (event.key === 'Escape') {
          setDraft(value)
          setEditing(false)
        }
      }}
      className={cn(inputClass, 'w-full', className)}
      placeholder={placeholder}
    />
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wide text-[var(--lux-muted-soft)]">
      {label}
      {children}
    </label>
  )
}

function RadioGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<[string, string]>
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--lux-muted-soft)]">{label}</p>
      <div className="space-y-2">
        {options.map(([optionValue, labelText]) => (
          <label key={optionValue} className="flex items-center gap-2 text-sm text-[var(--lux-muted)]">
            <input type="radio" checked={value === optionValue} onChange={() => onChange(optionValue)} />
            {labelText}
          </label>
        ))}
      </div>
    </div>
  )
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-7 w-7 place-items-center rounded-md text-[var(--lux-muted-soft)] hover:bg-[var(--lux-overlay-hover)] hover:text-[var(--lux-text)] disabled:cursor-not-allowed disabled:opacity-35"
    >
      {children}
    </button>
  )
}

function CoursePreview({ document, onClose }: { document: CourseDocument; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 p-4 backdrop-blur-sm">
      <div className="mx-auto max-w-4xl rounded-lg border border-black/10 bg-[#F8F6F0] p-6 text-[#1F1B16] shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{document.title}</h1>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-black/5" aria-label="Close preview">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-8">
          {(document.lessons ?? []).map((lesson) => (
            <section key={lesson.id} className="rounded-lg border border-black/10 bg-white p-5">
              <p className="text-xs font-bold uppercase text-[#0F6B4A]">{lesson.type}</p>
              <h2 className="mt-1 text-xl font-bold">{lesson.title}</h2>
              <div className="mt-4 space-y-3">
                {lesson.blocks.map((block) => (
                  <div key={block.id} className="rounded border border-black/10 p-3">
                    <p className="font-semibold">{block.title || getBlockDefinition(block.type).label}</p>
                    {block.content && <p className="mt-1 whitespace-pre-wrap text-sm text-black/65">{block.content}</p>}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
