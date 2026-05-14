'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Film, Edit2, Trash2, Copy, Archive, Globe } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { scenariosApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, truncate } from '@/lib/utils'
import type { Scenario, ScenarioStatus } from '@/types'

const statusFilters: { label: string; value: ScenarioStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
]

const templates = ['BLANK', 'COURSE', 'ASSESSMENT', 'TUTORIAL'] as const

interface CreateModalProps {
  open: boolean
  onClose: () => void
}

function CreateScenarioModal({ open, onClose }: CreateModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [template, setTemplate] = useState<string>('BLANK')
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => scenariosApi.create({ title, description, template }),
    onSuccess: () => {
      toast.success('Scenario created!')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
      onClose()
      setTitle('')
      setDescription('')
      setTemplate('BLANK')
    },
    onError: () => toast.error('Failed to create scenario'),
  })

  return (
    <Modal open={open} onClose={onClose} title="New Scenario" size="md">
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="e.g. Introduction to Calculus"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          id="scenario-title"
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description…"
            rows={3}
            className="w-full bg-white/5 border border-white/10 rounded-lg text-slate-100 text-sm px-3.5 py-2.5 resize-none placeholder:text-slate-500 focus:outline-none focus:border-[#0F6B4A] focus:ring-1 focus:ring-[#0F6B4A]/30 transition-all"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Template</label>
          <div className="grid grid-cols-2 gap-2">
            {templates.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTemplate(t)}
                className={`p-3 rounded-xl border text-sm font-medium transition-all text-left ${
                  template === t
                    ? 'border-[#0F6B4A] bg-[#0F6B4A]/18 text-[#83BFA1]'
                    : 'border-white/10 bg-white/4 text-slate-400 hover:border-white/20'
                }`}
              >
                {t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutate()} loading={isPending} disabled={!title.trim()}>
            Create Scenario
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default function ScenariosPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'ALL'>('ALL')
  const [createOpen, setCreateOpen] = useState(false)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['scenarios', statusFilter, search],
    queryFn: () =>
      scenariosApi
        .getAll({ status: statusFilter === 'ALL' ? undefined : statusFilter, search })
        .then((r) => r.data as Scenario[]),
  })

  const { mutate: deleteScenario } = useMutation({
    mutationFn: (id: string) => scenariosApi.delete(id),
    onSuccess: () => {
      toast.success('Scenario deleted')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
    onError: () => toast.error('Failed to delete scenario'),
  })

  const { mutate: duplicateScenario } = useMutation({
    mutationFn: (id: string) => scenariosApi.duplicate(id),
    onSuccess: () => {
      toast.success('Scenario duplicated')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })

  const { mutate: publishScenario } = useMutation({
    mutationFn: (id: string) => scenariosApi.publish(id),
    onSuccess: () => {
      toast.success('Scenario published!')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })

  const { mutate: archiveScenario } = useMutation({
    mutationFn: (id: string) => scenariosApi.archive(id),
    onSuccess: () => {
      toast.success('Scenario archived')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })

  const scenarios = data ?? []

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Scenarios</h1>
          <p className="text-sm text-slate-500 mt-0.5">{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus size={14} className="mr-1" /> New Scenario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search scenarios…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="scenario-search"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-[#0F6B4A] text-[#FFF8EC]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : scenarios.length === 0 ? (
        <EmptyState
          icon={<Film size={22} />}
          title="No scenarios found"
          description="Create your first scenario to get started"
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1" /> New Scenario
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {scenarios.map((scenario: Scenario) => (
            <Card key={scenario.id} className="group flex flex-col">
              <div className="p-5 flex-1 flex flex-col">
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="h-9 w-9 rounded-xl bg-[#0F6B4A]/18 border border-[#0F6B4A]/40 flex items-center justify-center flex-shrink-0">
                    <Film size={16} className="text-[#83BFA1]" />
                  </div>
                  <StatusBadge status={scenario.status} />
                </div>

                <h3 className="font-semibold text-slate-100 mb-1 leading-snug">{scenario.titre ?? scenario.title}</h3>
                {scenario.description && (
                  <p className="text-xs text-slate-500 mb-3 leading-relaxed">{truncate(scenario.description, 80)}</p>
                )}
                <div className="flex items-center gap-3 mt-auto text-xs text-slate-600">
                  <span>{formatDate(scenario.dateCreation ?? scenario.createdAt)}</span>
                  <span>·</span>
                  <span className="capitalize">{(scenario.template ?? 'scenario').toLowerCase()}</span>
                  <span>·</span>
                  <span>{scenario.modules?.length ?? 0} modules</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-white/6 px-4 py-3 flex items-center gap-1">
                <Link href={`/dashboard/scenarios/${scenario.id}/edit`} className="flex-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5">
                    <Edit2 size={13} /> Edit
                  </Button>
                </Link>
                <button
                  onClick={() => duplicateScenario(scenario.id)}
                  title="Duplicate"
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors"
                >
                  <Copy size={13} />
                </button>
                {scenario.status === 'DRAFT' && (
                  <button
                    onClick={() => publishScenario(scenario.id)}
                    title="Publish"
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <Globe size={13} />
                  </button>
                )}
                {scenario.status === 'PUBLISHED' && (
                  <button
                    onClick={() => archiveScenario(scenario.id)}
                    title="Archive"
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <Archive size={13} />
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Delete this scenario?')) deleteScenario(scenario.id)
                  }}
                  title="Delete"
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateScenarioModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  )
}
