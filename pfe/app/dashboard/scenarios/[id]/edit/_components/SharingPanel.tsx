'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { UserPlus, Trash2, ChevronDown, Search } from 'lucide-react'
import { scenariosApi, usersApi } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Spinner'
import type { User, ScenarioShare, SharePermission } from '@/types'

interface Props { scenarioId: string }

export function SharingPanel({ scenarioId }: Props) {
  const qc = useQueryClient()
  const [searchEmail, setSearchEmail] = useState('')
  const [selectedUserId, setSelectedUserId] = useState('')
  const [permission, setPermission] = useState<SharePermission>('READ')

  const { data: shares, isLoading } = useQuery<ScenarioShare[]>({
    queryKey: ['shares', scenarioId],
    queryFn: () => scenariosApi.getShares(scenarioId).then(r => r.data),
  })

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then(r => r.data),
  })

  const { mutate: addShare, isPending } = useMutation({
    mutationFn: () => scenariosApi.share(scenarioId, { userId: selectedUserId, permission }),
    onSuccess: () => {
      toast.success('Access granted')
      qc.invalidateQueries({ queryKey: ['shares', scenarioId] })
      setSelectedUserId('')
    },
    onError: () => toast.error('Failed to share'),
  })

  const { mutate: revokeShare } = useMutation({
    mutationFn: (shareId: string) => scenariosApi.revokeShare(scenarioId, shareId),
    onSuccess: () => {
      toast.success('Access revoked')
      qc.invalidateQueries({ queryKey: ['shares', scenarioId] })
    },
  })

  const filteredUsers = (users ?? []).filter(u =>
    u.email.includes(searchEmail) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchEmail.toLowerCase())
  )

  return (
    <div className="p-5 space-y-5">
      <h3 className="text-sm font-semibold text-slate-200">Share Scenario</h3>

      {/* Add share */}
      <div className="space-y-3">
        <Input
          placeholder="Search by email or name…"
          icon={<Search size={14} />}
          value={searchEmail}
          onChange={e => setSearchEmail(e.target.value)}
          id="share-search"
        />

        {searchEmail && filteredUsers.length > 0 && (
          <div className="bg-[#0d0f17] border border-white/10 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
            {filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => { setSelectedUserId(u.id); setSearchEmail(`${u.firstName} ${u.lastName}`) }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 text-left transition-colors ${selectedUserId === u.id ? 'bg-[#0F6B4A]/16' : ''}`}
              >
                <Avatar firstName={u.firstName} lastName={u.lastName} size="xs" />
                <div>
                  <p className="text-xs font-medium text-slate-200">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-slate-500">{u.email}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={permission}
              onChange={e => setPermission(e.target.value as SharePermission)}
              className="w-full bg-white/5 border border-white/10 rounded-lg text-slate-100 text-sm h-9 pl-3 pr-8 appearance-none focus:outline-none focus:border-[#0F6B4A] transition-all"
            >
              <option value="READ">Can view</option>
              <option value="EDIT">Can edit</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <Button size="sm" onClick={() => addShare()} loading={isPending} disabled={!selectedUserId}>
            <UserPlus size={13} className="mr-1" /> Share
          </Button>
        </div>
      </div>

      {/* Current shares */}
      <div>
        <p className="text-xs font-medium text-slate-500 uppercase mb-2">People with access</p>
        {isLoading ? (
          <div className="flex justify-center py-4"><Spinner size="sm" /></div>
        ) : (
          <div className="space-y-2">
            {(shares ?? []).map(share => (
              <div key={share.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/4">
                <Avatar firstName={share.user?.firstName} lastName={share.user?.lastName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{share.user?.firstName} {share.user?.lastName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{share.user?.email}</p>
                </div>
                <Badge variant={share.permission === 'EDIT' ? 'purple' : 'info'} size="sm">
                  {share.permission === 'EDIT' ? 'Editor' : 'Viewer'}
                </Badge>
                <button onClick={() => revokeShare(share.id)} className="p-1 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {(!shares || shares.length === 0) && (
              <p className="text-xs text-slate-600 text-center py-4">Not shared with anyone</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
