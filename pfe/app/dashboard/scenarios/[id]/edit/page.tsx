'use client'

import { useState, use } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { ArrowLeft, HelpCircle } from 'lucide-react'
import { scenariosApi } from '@/lib/api'
import { ModuleTree } from './_components/ModuleTree'
import { ActivityEditor } from './_components/ActivityEditor'
import { QuizBuilder } from './_components/QuizBuilder'
import { RightPanel } from './_components/RightPanel'
import { Spinner } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Scenario, Activity } from '@/types'

interface Ctx { id: string }
interface Selection { activityId: string; sequenceId: string; moduleId: string }

type CenterTab = 'editor' | 'quiz'

export default function ScenarioEditPage({ params }: { params: Promise<Ctx> }) {
  const { id } = use(params)
  const [selection, setSelection] = useState<Selection | null>(null)
  const [centerTab, setCenterTab] = useState<CenterTab>('editor')

  const { data: scenario, isLoading } = useQuery<Scenario>({
    queryKey: ['scenario', id],
    queryFn: () => scenariosApi.getOne(id).then(r => r.data),
  })

  // Resolve the selected activity object from nested data
  const selectedActivity: Activity | null = selection
    ? scenario?.modules
        ?.find(m => m.id === selection.moduleId)
        ?.sequences?.find(s => s.id === selection.sequenceId)
        ?.activities?.find(a => a.id === selection.activityId) ?? null
    : null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -m-6">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/7 bg-[#0d0f17] flex-shrink-0">
        <Link href="/dashboard/scenarios" className="p-1.5 rounded-lg hover:bg-white/8 text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={15} />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <h2 className="font-semibold text-slate-100 text-sm truncate">{scenario?.title}</h2>
          {scenario && <StatusBadge status={scenario.status} />}
        </div>
      </div>

      {/* 3-panel editor */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Module Tree */}
        <div className="w-56 flex-shrink-0 border-r border-white/7 bg-[#0d0f17] overflow-hidden flex flex-col">
          <ModuleTree
            scenarioId={id}
            selectedActivityId={selection?.activityId ?? null}
            onSelectActivity={(actId, seqId, modId) => {
              setSelection({ activityId: actId, sequenceId: seqId, moduleId: modId })
              setCenterTab('editor')
            }}
          />
        </div>

        {/* CENTER — Activity canvas */}
        <div className="flex-1 bg-[#111318] overflow-hidden flex flex-col min-w-0">
          {selectedActivity ? (
            <>
              {/* Center tab bar */}
              <div className="flex border-b border-white/7 px-2 pt-1 bg-[#111318]">
                {[
                  { id: 'editor' as CenterTab, label: 'Content' },
                  { id: 'quiz' as CenterTab, label: 'Quiz', disabled: selectedActivity.type !== 'QUIZ' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => !t.disabled && setCenterTab(t.id)}
                    disabled={t.disabled}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors',
                      centerTab === t.id
                        ? 'border-[#0F6B4A] text-[#83BFA1]'
                        : 'border-transparent text-slate-500 hover:text-slate-300',
                      t.disabled && 'opacity-30 cursor-not-allowed'
                    )}
                  >
                    {t.id === 'quiz' && <HelpCircle size={12} />}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-hidden">
                {centerTab === 'editor' && selection && (
                  <ActivityEditor
                    key={selectedActivity.id}
                    scenarioId={id}
                    moduleId={selection.moduleId}
                    sequenceId={selection.sequenceId}
                    activity={selectedActivity}
                  />
                )}
                {centerTab === 'quiz' && (
                  <QuizBuilder key={selectedActivity.id} activityId={selectedActivity.id} />
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center mb-4">
                <HelpCircle size={20} className="text-slate-500" />
              </div>
              <p className="text-sm text-slate-400 font-medium mb-1">No activity selected</p>
              <p className="text-xs text-slate-600">Select an activity from the left panel, or add a new one</p>
            </div>
          )}
        </div>

        {/* RIGHT — Properties/Sharing */}
        <div className="w-64 flex-shrink-0 border-l border-white/7 bg-[#0d0f17] overflow-hidden flex flex-col">
          <RightPanel scenarioId={id} />
        </div>
      </div>
    </div>
  )
}
