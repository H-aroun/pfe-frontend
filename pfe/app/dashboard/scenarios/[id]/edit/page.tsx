'use client'

import { use } from 'react'
import { useQuery } from '@tanstack/react-query'
import { scenariosApi } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import { InlineScenarioCourseEditor } from './_components/inline-course-editor/InlineScenarioCourseEditor'
import type { Scenario } from '@/types'

interface Ctx {
  id: string
}

export default function ScenarioEditPage({ params }: { params: Promise<Ctx> }) {
  const { id } = use(params)

  const { data: scenario, isLoading } = useQuery<Scenario>({
    queryKey: ['scenario', id],
    queryFn: () => scenariosApi.getOne(id).then((response) => response.data),
  })

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <InlineScenarioCourseEditor mode="edit" scenarioId={id} scenario={scenario} />
    </div>
  )
}
