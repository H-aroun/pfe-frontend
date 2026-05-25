'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Lock, Users, Trash2, Download, ChevronDown, Send, CheckCircle, XCircle, Archive } from 'lucide-react'
import { scenariosApi, usersApi, scormApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/context/SocketContext'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { downloadBlob } from '@/lib/utils'
import type { Scenario, User, ScenarioShare } from '@/types'

interface Props {
  scenarioId: string
}

export function RightPanel({ scenarioId }: Props) {
  const qc = useQueryClient()
  const { isAdmin, user } = useAuth()
  const { broadcastScenarioEdit } = useSocket()
  const [tab, setTab] = useState<'info' | 'share'>('info')
  const [shareUserId, setShareUserId] = useState('')
  const [permission, setPermission] = useState<'READ' | 'EDIT'>('READ')
  const [exporting, setExporting] = useState(false)

  const { data: scenario } = useQuery<Scenario>({
    queryKey: ['scenario', scenarioId],
    queryFn: () => scenariosApi.getOne(scenarioId).then(r => r.data),
  })

  const { data: shares, isLoading: loadingShares } = useQuery<ScenarioShare[]>({
    queryKey: ['shares', scenarioId],
    queryFn: () => scenariosApi.getShares(scenarioId).then(r => r.data),
    enabled: tab === 'share',
  })

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then(r => r.data),
    enabled: tab === 'share',
  })

  const { mutate: addShare, isPending: sharing } = useMutation({
    mutationFn: () => scenariosApi.share(scenarioId, { userId: shareUserId, permission }),
    onSuccess: () => {
      toast.success('Access granted')
      setShareUserId('')
      qc.invalidateQueries({ queryKey: ['shares', scenarioId] })
      broadcastScenarioEdit({ scenarioId, entityType: 'scenario', action: 'update' })
    },
    onError: () => toast.error('Failed to share'),
  })

  const { mutate: revokeShare } = useMutation({
    mutationFn: (shareId: string) => scenariosApi.revokeShare(scenarioId, shareId),
    onSuccess: () => {
      toast.success('Access revoked')
      qc.invalidateQueries({ queryKey: ['shares', scenarioId] })
      broadcastScenarioEdit({ scenarioId, entityType: 'scenario', action: 'update' })
    },
  })

  const invalidateScenario = () => {
    qc.invalidateQueries({ queryKey: ['scenario', scenarioId] })
    qc.invalidateQueries({ queryKey: ['scenarios'] })
  }

  const { mutate: submit } = useMutation({
    mutationFn: () => scenariosApi.submit(scenarioId),
    onSuccess: () => {
      toast.success('Submitted for review')
      invalidateScenario()
      broadcastScenarioEdit({ scenarioId, entityType: 'scenario', action: 'update' })
    },
  })

  const { mutate: approve } = useMutation({
    mutationFn: () => scenariosApi.approve(scenarioId),
    onSuccess: () => {
      toast.success('Approved')
      invalidateScenario()
      broadcastScenarioEdit({ scenarioId, entityType: 'scenario', action: 'update' })
    },
  })

  const { mutate: reject } = useMutation({
    mutationFn: () => scenariosApi.reject(scenarioId),
    onSuccess: () => {
      toast.success('Returned to draft')
      invalidateScenario()
      broadcastScenarioEdit({ scenarioId, entityType: 'scenario', action: 'update' })
    },
  })

  const { mutate: archive } = useMutation({
    mutationFn: () => scenariosApi.archive(scenarioId),
    onSuccess: () => {
      toast.success('Archived')
      invalidateScenario()
      broadcastScenarioEdit({ scenarioId, entityType: 'scenario', action: 'update' })
    },
  })

  const handleScormExport = async () => {
    setExporting(true)
    try {
      const res = await scormApi.export(scenarioId)
      downloadBlob(res.data, `${scenario?.title ?? scenario?.titre ?? 'scenario'}.zip`)
      toast.success('SCORM package downloaded')
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const courseLessons = scenario?.courseDocument?.lessons ?? scenario?.courseDocument?.pages ?? []
  const courseBlocks = courseLessons.reduce((total, lesson) => total + (lesson.blocks?.length ?? 0), 0)
  const courseSections = scenario?.courseDocument?.sections?.length ?? 0
  const scormVersion = scenario?.courseDocument?.settings?.scormVersion ?? '1.2'

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-white/7">
        {(['info', 'share'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize transition-colors border-b-2 ${tab === t
              ? 'border-[#0F6B4A] text-[#83BFA1]'
              : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t === 'info' ? 'Info' : 'Sharing'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'info' && scenario && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase">Status</p>
              <StatusBadge status={scenario.status} />
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase">Visibility</p>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Lock size={12} className={scenario.isPublic ? 'text-green-400' : 'text-slate-500'} />
                {scenario.isPublic ? 'Public' : 'Private'}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase">Course structure</p>
              <div className="text-xs text-slate-400 space-y-0.5">
                <p>{courseSections} sections</p>
                <p>{courseLessons.length} lessons</p>
                <p>{courseBlocks} blocks</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              {scenario.status === 'BROUILLON' && (
                <Button size="sm" className="w-full" onClick={() => submit()}>
                  <Send size={12} className="mr-1" /> Submit for review
                </Button>
              )}
              {scenario.status === 'EN_COURS_VALIDATION' && isAdmin && (
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="w-full" onClick={() => approve()}>
                    <CheckCircle size={12} className="mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="secondary" className="w-full" onClick={() => reject()}>
                    <XCircle size={12} className="mr-1" /> Reject
                  </Button>
                </div>
              )}
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={handleScormExport}
                loading={exporting}
              >
                <Download size={12} className="mr-1" /> Export SCORM {scormVersion}
              </Button>
              {scenario.status !== 'ARCHIVE' && (
                <Button size="sm" variant="ghost" className="w-full" onClick={() => archive()}>
                  <Archive size={12} className="mr-1" /> Archive
                </Button>
              )}
            </div>
          </div>
        )}

        {tab === 'share' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] text-slate-500 uppercase">Add collaborator</p>
              <div className="relative">
                <select
                  value={shareUserId}
                  onChange={e => setShareUserId(e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl text-slate-300 text-xs pl-3 pr-8 py-2 focus:outline-none focus:border-[#0F6B4A] transition-all"
                >
                  <option value="">Select user...</option>
                  {(users ?? []).filter((u: User) => u.id !== user?.id).map((u: User) => (
                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                  ))}
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
              <div className="flex gap-1">
                {(['READ', 'EDIT'] as const).map(p => (
                  <button key={p} onClick={() => setPermission(p)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${permission === p
                      ? 'border-[#0F6B4A] bg-[#0F6B4A]/18 text-[#83BFA1]'
                      : 'border-white/10 text-slate-500 hover:border-white/20'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <Button
                size="sm"
                className="w-full"
                onClick={() => addShare()}
                disabled={!shareUserId}
                loading={sharing}
              >
                <Users size={11} className="mr-1" /> Grant access
              </Button>
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-500 uppercase">Current access</p>
              {loadingShares ? (
                <Spinner size="sm" />
              ) : !(shares?.length) ? (
                <p className="text-xs text-slate-600 py-2">No collaborators yet</p>
              ) : (
                <div className="space-y-2">
                  {shares.map((s: ScenarioShare) => (
                    <div key={s.id} className="flex items-center gap-2 group">
                      <Avatar firstName={s.user.firstName} lastName={s.user.lastName} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-slate-300 truncate">{s.user.firstName} {s.user.lastName}</p>
                        <p className="text-[10px] text-slate-600">{s.permission}</p>
                      </div>
                      <button
                        onClick={() => revokeShare(s.id)}
                        className="p-1 rounded text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
