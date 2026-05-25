import { useCallback, useEffect, useRef, useState } from 'react'
import { scenariosApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/api'
import type { CourseDocument } from '@/types'
import type { SaveStatus } from './courseEditorModel'

interface UseCourseDocumentAutosaveOptions {
  scenarioId?: string
  document: CourseDocument
  enabled: boolean
  onSaved?: (document: CourseDocument) => void
}

export function useCourseDocumentAutosave({
  scenarioId,
  document,
  enabled,
  onSaved,
}: UseCourseDocumentAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('saved')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const lastSavedRef = useRef(JSON.stringify(document))
  const latestDocumentRef = useRef(document)
  const saveCounterRef = useRef(0)
  const onSavedRef = useRef(onSaved)

  useEffect(() => {
    latestDocumentRef.current = document
    onSavedRef.current = onSaved
  }, [document, onSaved])

  const saveNow = useCallback(async () => {
    if (!scenarioId || !enabled) return
    const saveId = saveCounterRef.current + 1
    saveCounterRef.current = saveId
    setStatus('saving')
    setErrorMessage('')

    try {
      const response = await scenariosApi.updateCourseDocument(scenarioId, latestDocumentRef.current)
      if (saveId !== saveCounterRef.current) return
      if (!response) return
      lastSavedRef.current = JSON.stringify(response.data)
      setStatus('saved')
      onSavedRef.current?.(response.data)
    } catch (error) {
      if (saveId === saveCounterRef.current) {
        setStatus('error')
        setErrorMessage(getApiErrorMessage(error, 'Échec de la sauvegarde.'))
      }
    }
  }, [enabled, scenarioId])

  useEffect(() => {
    if (!scenarioId || !enabled) return
    const nextJson = JSON.stringify(document)
    if (nextJson === lastSavedRef.current) return

    setStatus('dirty')
    const timeout = window.setTimeout(() => {
      void saveNow()
    }, 650)

    return () => window.clearTimeout(timeout)
  }, [document, enabled, saveNow, scenarioId])

  const label =
    status === 'saving'
      ? 'Saving...'
      : status === 'error'
        ? errorMessage || 'Save failed - retry'
        : status === 'dirty'
          ? 'Saving...'
          : 'Saved'

  return {
    status,
    label,
    errorMessage,
    retry: saveNow,
  }
}