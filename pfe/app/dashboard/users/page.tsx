'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Plus, Pencil, Trash2, Users, RefreshCw } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usersApi } from '@/lib/api'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import type { User, UserRole } from '@/types'

type UserForm = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: UserRole
}

const emptyForm: UserForm = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  role: 'TEACHER',
}

function userName(user: User) {
  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
  return fullName || user.email
}

export default function UsersPage() {
  const router = useRouter()
  const { isAdmin, isLoading } = useAuth()
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [form, setForm] = useState<UserForm>(emptyForm)
  const [formError, setFormError] = useState('')
  const [page, setPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      router.replace('/dashboard')
    }
  }, [isAdmin, isLoading, router])

  const { data: users, isLoading: loadingUsers, error, refetch } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => usersApi.getAll().then((r) => r.data),
    enabled: isAdmin,
  })

  const sortedUsers = useMemo(
    () => [...(users ?? [])].sort((a, b) => userName(a).localeCompare(userName(b))),
    [users],
  )
  
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / itemsPerPage))
  const paginatedUsers = sortedUsers.slice((page - 1) * itemsPerPage, page * itemsPerPage)

  // Reset page when it exceeds bounds (e.g. after delete)
  if (page > totalPages) setPage(totalPages)

  const closeForm = () => {
    setFormOpen(false)
    setEditingUser(null)
    setForm(emptyForm)
    setFormError('')
  }

  const openCreate = () => {
    setEditingUser(null)
    setForm(emptyForm)
    setFormError('')
    setFormOpen(true)
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
      password: '',
      role: user.role,
    })
    setFormError('')
    setFormOpen(true)
  }

  const createMutation = useMutation({
    mutationFn: (payload: UserForm) => usersApi.create(payload),
    onSuccess: () => {
      toast.success('User created')
      qc.invalidateQueries({ queryKey: ['users'] })
      closeForm()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Failed to create user')
      toast.error('Failed to create user')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UserForm }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      toast.success('User updated')
      qc.invalidateQueries({ queryKey: ['users'] })
      closeForm()
    },
    onError: (err: unknown) => {
      setFormError(err instanceof Error ? err.message : 'Failed to update user')
      toast.error('Failed to update user')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      toast.success('User deleted')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => toast.error('Failed to delete user'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      usersApi.updateRole(id, role),
    onSuccess: () => {
      toast.success('Role updated')
      qc.invalidateQueries({ queryKey: ['users'] })
    },
    onError: () => toast.error('Failed to update role'),
  })

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError('')

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) {
      setFormError('First name, last name, and email are required')
      return
    }

    if (!editingUser && form.password.trim().length < 8) {
      setFormError('Password must be at least 8 characters')
      return
    }

    const payload = {
      ...form,
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
    }

    if (editingUser) {
      await updateMutation.mutateAsync({ id: editingUser.id, payload })
      return
    }

    await createMutation.mutateAsync(payload)
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[var(--lux-text)]">Users</h1>
          <p className="mt-0.5 text-sm text-[var(--lux-muted)]">Manage accounts and roles</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} />
            New user
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-[var(--lux-text)]">All users</h3>
          <span className="text-xs text-[var(--lux-muted)]">{sortedUsers.length} accounts</span>
        </CardHeader>
        <CardBody className="p-0">
          {loadingUsers ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : error ? (
            <EmptyState
              icon={<Users size={20} />}
              title="Unable to load users"
              description="Refresh the page or try again."
              action={
                <Button size="sm" variant="secondary" onClick={() => refetch()}>
                  Retry
                </Button>
              }
            />
          ) : sortedUsers.length === 0 ? (
            <EmptyState
              icon={<Users size={20} />}
              title="No users found"
              action={<Button size="sm" onClick={openCreate}><Plus size={14} /> Add user</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[860px] w-full text-sm">
                <thead className="border-b border-[var(--lux-line)]">
                  <tr className="text-left text-xs uppercase text-[var(--lux-muted)]">
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Joined</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.map((user) => {
                    const fullName = userName(user)
                    return (
                      <tr key={user.id} className="border-b border-[var(--lux-line)]/60 last:border-b-0">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar firstName={user.firstName} lastName={user.lastName} name={fullName} size="sm" />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[var(--lux-text)]">{fullName}</p>
                              <p className="text-xs text-[var(--lux-muted)]">ID {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--lux-muted)]">{user.email}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <StatusBadge status={user.role} />
                            <select
                              value={user.role}
                              onChange={(e) =>
                                roleMutation.mutate({ id: user.id, role: e.target.value as UserRole })
                              }
                              className="h-9 rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 text-xs text-[var(--lux-text)]"
                              aria-label={`Change role for ${fullName}`}
                            >
                              <option value="TEACHER">Teacher</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-[var(--lux-muted)]">{formatDate(user.createdAt)}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="secondary" size="icon" onClick={() => openEdit(user)} aria-label={`Edit ${fullName}`}>
                              <Pencil size={14} />
                            </Button>
                            <Button
                              variant="danger"
                              size="icon"
                              onClick={() => {
                                if (window.confirm(`Delete ${fullName}?`)) {
                                  deleteMutation.mutate(user.id)
                                }
                              }}
                              aria-label={`Delete ${fullName}`}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[var(--lux-line)] px-5 py-3">
              <span className="text-xs text-[var(--lux-muted)]">
                Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, sortedUsers.length)} of {sortedUsers.length} users
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        open={formOpen}
        onClose={closeForm}
        title={editingUser ? 'Edit user' : 'Create user'}
        size="lg"
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
              {formError}
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="user-first-name"
              label="First name"
              value={form.firstName}
              onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))}
            />
            <Input
              id="user-last-name"
              label="Last name"
              value={form.lastName}
              onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))}
            />
          </div>
          <Input
            id="user-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            {!editingUser && (
              <Input
                id="user-password"
                label="Password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((current) => ({ ...current, password: e.target.value }))}
              />
            )}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--lux-text)]">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm((current) => ({ ...current, role: e.target.value as UserRole }))}
                className="h-11 w-full rounded-xl border border-[var(--lux-line)] bg-[var(--lux-surface)] px-3 text-sm text-[var(--lux-text)]"
              >
                <option value="TEACHER">Teacher</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Cancel
            </Button>
            <Button type="submit" loading={createMutation.isPending || updateMutation.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
