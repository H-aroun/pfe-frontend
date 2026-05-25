'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Film, Edit2, Trash2, Copy, Archive, Send, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { scenariosApi } from '@/lib/api'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate, truncate } from '@/lib/utils'
import type { Scenario, ScenarioStatus } from '@/types'
import { useAuth } from '@/context/AuthContext'

const statusFilters: { label: string; value: ScenarioStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Draft', value: 'BROUILLON' },
  { label: 'Review', value: 'EN_COURS_VALIDATION' },
  { label: 'Approved', value: 'APPROUVE' },
  { label: 'Archived', value: 'ARCHIVE' },
]

export default function ScenariosPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ScenarioStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const itemsPerPage = 9
  const qc = useQueryClient()
  const { user } = useAuth()
  console.log("user", user);
  
  const { data, isLoading } = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => user?.role === "TEACHER" ? scenariosApi.getAll().then((r) => r.data as Scenario[] ): scenariosApi.getAllAdmin().then((r) => r.data as Scenario[]),
  })
  const othersScenarios =  data?.filter((item: Scenario) => item?.status !== "BROUILLON" && item?.author?.id !== user?.id)
  const myScenarios = data?.filter((item: Scenario) => item?.author?.id === user?.id)
  const allData = [
    ...(othersScenarios || []),
    ...(myScenarios || [])
  ]
  console.log("alll data ", allData);
  
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

  const { mutate: submitScenario } = useMutation({
    mutationFn: (id: string) => scenariosApi.submit(id),
    onSuccess: () => {
      toast.success('Scenario submitted for review')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })

  const { mutate: approveScenario } = useMutation({
    mutationFn: (id: string) => scenariosApi.approve(id),
    onSuccess: () => {
      toast.success('Scenario approved')
      qc.invalidateQueries({ queryKey: ['scenarios'] })
    },
  })

  const { mutate: rejectScenario } = useMutation({
    mutationFn: (id: string) => scenariosApi.reject(id),
    onSuccess: () => {
      toast.success('Scenario returned to draft')
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

  const scenarios = allData ?? []
  
  const filteredScenarios = scenarios.filter((s) => {
    if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
    const term = search.toLowerCase()
    if (term) {
      const titleMatch = (s.title ?? s.titre ?? '').toLowerCase().includes(term)
      const descMatch = (s.description ?? '').toLowerCase().includes(term)
      if (!titleMatch && !descMatch) return false
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredScenarios.length / itemsPerPage))
  const paginatedScenarios = filteredScenarios.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Reset page when filters change
  if (page > totalPages) setPage(totalPages)
console.log("paginatedScenarios ", paginatedScenarios);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Scenarios</h1>
          <p className="text-sm text-slate-500 mt-0.5">{scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/dashboard/scenarios/new">
          <Button size="sm">
            <Plus size={14} className="mr-1" /> New Scenario
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 max-w-xs">
          <Input
            placeholder="Search scenarios…"
            icon={<Search size={14} />}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            id="scenario-search"
          />
        </div>
        <div className="flex items-center gap-1 bg-white/5 border border-white/8 rounded-xl p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1) }}
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
      ) : filteredScenarios.length === 0 ? (
        <EmptyState
          icon={<Film size={22} />}
          title="No scenarios found"
          description="Create your first scenario to get started"
          action={
            <Link href="/dashboard/scenarios/new">
              <Button size="sm">
                <Plus size={14} className="mr-1" /> New Scenario
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {paginatedScenarios.map((scenario: Scenario) => (
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
                  {(scenario.author?.id == user?.id) && <Button variant="ghost" size="sm" className="w-full justify-start gap-1.5">
                    <Edit2 size={13} /> Edit
                  </Button>}
                </Link>
                <button
                  onClick={() => duplicateScenario(scenario.id)}
                  title="Duplicate"
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors"
                >
                  <Copy size={13} />
                </button>
                {scenario.status === 'BROUILLON' && (
                  <button
                    onClick={() => submitScenario(scenario.id)}
                    title="Submit for review"
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                  >
                    <Send size={13} />
                  </button>
                )}
                {scenario.status === 'EN_COURS_VALIDATION' && (
                  <>
                    <button
                      onClick={() => approveScenario(scenario.id)}
                      title="Approve"
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-green-400 hover:bg-green-500/10 transition-colors"
                    >
                      <CheckCircle size={13} />
                    </button>
                    <button
                      onClick={() => rejectScenario(scenario.id)}
                      title="Reject"
                      className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <XCircle size={13} />
                    </button>
                  </>
                )}
                {scenario.status !== 'ARCHIVE' && (
                  <button
                    onClick={() => archiveScenario(scenario.id)}
                    title="Archive"
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                  >
                    <Archive size={13} />
                  </button>
                )}
                {scenario?.author?.id === user?.id && <button
                  onClick={() => {
                    if (confirm('Delete this scenario?')) deleteScenario(scenario.id)
                  }}
                  title="Delete"
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <Trash2 size={13} />
                </button>}
              </div>
            </Card>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}

    </div>
  )
}
