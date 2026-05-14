'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, ChevronDown, Plus, Trash2, Layers, List, Zap } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { scenariosApi } from '@/lib/api'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'
import type { Scenario, ScenarioModule, Sequence, Activity, ActivityType } from '@/types'

const activityTypeColors: Record<ActivityType, string> = {
  VIDEO:  'text-[#83BFA1]',
  TEXT:   'text-[#83BFA1]',
  QUIZ:   'text-amber-400',
  FILE:   'text-green-400',
  LINK:   'text-rose-400',
}

interface Props {
  scenarioId: string
  selectedActivityId: string | null
  onSelectActivity: (activityId: string, sequenceId: string, moduleId: string) => void
}

export function ModuleTree({ scenarioId, selectedActivityId, onSelectActivity }: Props) {
  const qc = useQueryClient()
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [expandedSequences, setExpandedSequences] = useState<Set<string>>(new Set())

  const { data: scenario, isLoading } = useQuery<Scenario>({
    queryKey: ['scenario', scenarioId],
    queryFn: () => scenariosApi.getOne(scenarioId).then(r => r.data),
  })

  const { mutate: addModule } = useMutation({
    mutationFn: () => scenariosApi.createModule(scenarioId, { title: 'New Module' }),
    onSuccess: () => { toast.success('Module added'); qc.invalidateQueries({ queryKey: ['scenario', scenarioId] }) },
  })

  const { mutate: addSequence } = useMutation({
    mutationFn: (moduleId: string) => scenariosApi.createSequence(scenarioId, moduleId, { title: 'New Sequence' }),
    onSuccess: () => { toast.success('Sequence added'); qc.invalidateQueries({ queryKey: ['scenario', scenarioId] }) },
  })

  const { mutate: addActivity } = useMutation({
    mutationFn: ({ moduleId, seqId }: { moduleId: string; seqId: string }) =>
      scenariosApi.createActivity(scenarioId, moduleId, seqId, { title: 'New Activity', type: 'TEXT' }),
    onSuccess: () => { toast.success('Activity added'); qc.invalidateQueries({ queryKey: ['scenario', scenarioId] }) },
  })

  const { mutate: deleteModule } = useMutation({
    mutationFn: (moduleId: string) => scenariosApi.deleteModule(scenarioId, moduleId),
    onSuccess: () => { toast.success('Module deleted'); qc.invalidateQueries({ queryKey: ['scenario', scenarioId] }) },
  })

  const toggleModule = (id: string) => setExpandedModules(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const toggleSequence = (id: string) => setExpandedSequences(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })

  if (isLoading) return <div className="flex justify-center py-8"><Spinner size="sm" /></div>

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/7">
        <span className="text-xs font-semibold text-slate-400 uppercase">Modules</span>
        <button
          onClick={() => addModule()}
          className="h-5 w-5 rounded flex items-center justify-center text-slate-500 hover:text-[#83BFA1] hover:bg-[#0F6B4A]/18 transition-colors"
          title="Add module"
        >
          <Plus size={12} />
        </button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto py-1">
        {(scenario?.modules ?? []).map((mod: ScenarioModule) => {
          const modExpanded = expandedModules.has(mod.id)
          return (
            <div key={mod.id}>
              {/* Module row */}
              <div className="group flex items-center gap-1 px-2 py-1.5 hover:bg-white/4 cursor-pointer"
                onClick={() => toggleModule(mod.id)}>
                {modExpanded
                  ? <ChevronDown size={11} className="text-slate-500 flex-shrink-0" />
                  : <ChevronRight size={11} className="text-slate-500 flex-shrink-0" />}
                <Layers size={11} className="text-[#83BFA1] flex-shrink-0" />
                <span className="text-xs font-medium text-slate-300 flex-1 truncate">{mod.title}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100">
                  <button onClick={e => { e.stopPropagation(); addSequence(mod.id) }}
                    className="p-0.5 hover:text-[#83BFA1]" title="Add sequence">
                    <Plus size={10} className="text-slate-500" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); if (confirm('Delete module?')) deleteModule(mod.id) }}
                    className="p-0.5 hover:text-red-400" title="Delete module">
                    <Trash2 size={10} className="text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Sequences */}
              {modExpanded && (mod.sequences ?? []).map((seq: Sequence) => {
                const seqExpanded = expandedSequences.has(seq.id)
                return (
                  <div key={seq.id}>
                    <div className="group flex items-center gap-1 pl-5 pr-2 py-1.5 hover:bg-white/4 cursor-pointer"
                      onClick={() => toggleSequence(seq.id)}>
                      {seqExpanded
                        ? <ChevronDown size={10} className="text-slate-500 flex-shrink-0" />
                        : <ChevronRight size={10} className="text-slate-500 flex-shrink-0" />}
                      <List size={10} className="text-[#83BFA1] flex-shrink-0" />
                      <span className="text-[11px] text-slate-400 flex-1 truncate">{seq.title}</span>
                      <button onClick={e => { e.stopPropagation(); addActivity({ moduleId: mod.id, seqId: seq.id }) }}
                        className="p-0.5 opacity-0 group-hover:opacity-100 hover:text-[#83BFA1]" title="Add activity">
                        <Plus size={10} className="text-slate-500" />
                      </button>
                    </div>

                    {/* Activities */}
                    {seqExpanded && (seq.activities ?? []).map((act: Activity) => (
                      <button
                        key={act.id}
                        onClick={() => onSelectActivity(act.id, seq.id, mod.id)}
                        className={cn(
                          'w-full flex items-center gap-1.5 pl-9 pr-2 py-1.5 text-left transition-colors',
                          selectedActivityId === act.id
                            ? 'bg-[#0F6B4A]/18 text-[#83BFA1]'
                            : 'hover:bg-white/4 text-slate-400'
                        )}
                      >
                        <Zap size={9} className={cn('flex-shrink-0', activityTypeColors[act.type])} />
                        <span className="text-[10px] truncate">{act.title}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
        {!scenario?.modules?.length && (
          <p className="text-[11px] text-slate-600 text-center py-8 px-4">
            No modules yet.<br />Click + to add one.
          </p>
        )}
      </div>
    </div>
  )
}
