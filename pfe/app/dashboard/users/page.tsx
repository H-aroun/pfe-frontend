'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Users, Trash2, ChevronDown } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { formatDate } from '@/lib/utils'
import type { User } from '@/types'

export default function UsersPage() {
  const { isAdmin } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()

  useEffect(() => {
    if (!isAdmin) router.replace('/dashboard')
  }, [isAdmin, router])

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then(r => r.data),
    enabled: isAdmin,
  })

  const { mutate: changeRole } = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => { toast.success('Role updated'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: () => toast.error('Failed to update role'),
  })

  const { mutate: deleteUser } = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { toast.success('User removed'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: () => toast.error('Failed to delete user'),
  })

  if (!isAdmin) return null

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-100">User Management</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage platform accounts and roles</p>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-slate-200">All Users</h3>
          <span className="text-xs text-slate-500">{users?.length ?? 0} accounts</span>
        </CardHeader>
        <CardBody className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !users?.length ? (
            <EmptyState icon={<Users size={22} />} title="No users found" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-slate-500 pb-3 pr-4 first:pl-0">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u: User) => (
                    <tr key={u.id} className="hover:bg-white/2 group">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <Avatar firstName={u.firstName} lastName={u.lastName} size="sm" />
                          <span className="font-medium text-slate-200">{u.firstName} {u.lastName}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-slate-400 text-xs">{u.email}</td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={u.role} />
                      </td>
                      <td className="py-3 pr-4 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {/* Role toggle */}
                          <div className="relative">
                            <select
                              value={u.role}
                              onChange={e => changeRole({ id: u.id, role: e.target.value })}
                              className="appearance-none bg-white/5 border border-white/10 rounded-lg text-slate-300 text-xs pl-2 pr-6 py-1.5 focus:outline-none focus:border-[#0F6B4A] transition-all cursor-pointer"
                            >
                              <option value="TEACHER">Teacher</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                          </div>
                          <button
                            onClick={() => { if (confirm(`Delete ${u.firstName}?`)) deleteUser(u.id) }}
                            className="p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            title="Delete user"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
