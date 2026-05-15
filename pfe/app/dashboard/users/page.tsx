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

function getUserName(user: User) {
  const firstName = user.firstName ?? ''
  const lastName = user.lastName ?? ''
  const fullName = `${firstName} ${lastName}`.trim()

  return {
    firstName,
    lastName,
    fullName: fullName || user.email,
  }
}

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
            <div className="-mx-5 overflow-x-auto px-5">
              <table className="min-w-[760px] w-full table-fixed text-sm">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="w-[30%] pb-3 pr-4 text-left text-xs font-medium text-slate-500">User</th>
                    <th className="w-[30%] pb-3 pr-4 text-left text-xs font-medium text-slate-500">Email</th>
                    <th className="w-[14%] pb-3 pr-4 text-left text-xs font-medium text-slate-500">Role</th>
                    <th className="w-[14%] pb-3 pr-4 text-left text-xs font-medium text-slate-500">Joined</th>
                    <th className="w-[12%] pb-3 text-right text-xs font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((u: User) => {
                    const { firstName, lastName, fullName } = getUserName(u)

                    return (
                      <tr key={u.id} className="group hover:bg-white/2">
                        <td className="py-3 pr-4">
                          <div className="flex min-w-0 items-center gap-2.5">
                            <Avatar firstName={firstName} lastName={lastName} name={fullName} size="sm" />
                            <span className="min-w-0 truncate font-medium text-slate-200">{fullName}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-400">
                          <span className="block truncate">{u.email}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={u.role} />
                        </td>
                        <td className="py-3 pr-4 text-xs text-slate-500">{formatDate(u.createdAt)}</td>
                        <td className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="relative">
                              <select
                                value={u.role}
                                onChange={e => changeRole({ id: u.id, role: e.target.value })}
                                className="h-8 appearance-none rounded-lg border border-white/10 bg-white/5 pl-2 pr-6 text-xs text-slate-300 transition-all cursor-pointer focus:outline-none focus:border-[#0F6B4A]"
                                aria-label={`Change role for ${fullName}`}
                              >
                                <option value="TEACHER">Teacher</option>
                                <option value="ADMIN">Admin</option>
                              </select>
                              <ChevronDown size={11} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500" />
                            </div>
                            <button
                              onClick={() => { if (confirm(`Delete ${fullName}?`)) deleteUser(u.id) }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                              title="Delete user"
                              aria-label={`Delete ${fullName}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
