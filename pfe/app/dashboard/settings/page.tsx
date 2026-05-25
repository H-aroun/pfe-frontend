'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Save, User, Palette } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { usersApi } from '@/lib/api'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Lock } from 'lucide-react'
import type { User as AppUser } from '@/types'

type ProfileForm = {
  firstName: string
  lastName: string
  email: string
}

function ProfileSettings({ user, onSaved }: { user: AppUser; onSaved: () => Promise<void> }) {
  const [form, setForm] = useState<ProfileForm>({
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
  })

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: ProfileForm) => usersApi.updateMe(data),
    onSuccess: async () => {
      toast.success('Profile updated')
      await onSaved()
    },
    onError: () => toast.error('Update failed'),
  })

  const fullName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <User size={15} />
          <h3 className="text-sm font-semibold text-[var(--lux-text)]">Profile</h3>
        </div>
      </CardHeader>
      <CardBody className="space-y-5">
        <div className="flex items-center gap-4">
          <Avatar firstName={user.firstName} lastName={user.lastName} name={fullName} size="xl" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[var(--lux-text)]">
              {fullName || user.email}
            </p>
            <p className="truncate text-sm text-[var(--lux-muted)]">{user.email}</p>
            <div className="mt-2">
              <StatusBadge status={user.role} />
            </div>
          </div>
        </div>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault()
            updateProfile(form)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="settings-first-name"
              label="First name"
              value={form.firstName}
              onChange={(e) => setForm((current) => ({ ...current, firstName: e.target.value }))}
            />
            <Input
              id="settings-last-name"
              label="Last name"
              value={form.lastName}
              onChange={(e) => setForm((current) => ({ ...current, lastName: e.target.value }))}
            />
          </div>
          <Input
            id="settings-email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isPending}>
              <Save size={14} />
              Save profile
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

function PasswordSettings() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const { mutate: updatePassword, isPending } = useMutation({
    mutationFn: (newPassword: string) => usersApi.updateMe({ password: newPassword }),
    onSuccess: () => {
      toast.success('Password updated successfully')
      setPassword('')
      setConfirmPassword('')
      setError('')
    },
    onError: () => toast.error('Failed to update password'),
  })

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    updatePassword(password)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock size={15} />
          <h3 className="text-sm font-semibold text-[var(--lux-text)]">Security</h3>
        </div>
      </CardHeader>
      <CardBody>
        <form className="space-y-4 max-w-md" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}
          <Input
            id="settings-password"
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            id="settings-confirm-password"
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="submit" loading={isPending} disabled={!password || !confirmPassword}>
              <Save size={14} />
              Update password
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}

export default function SettingsPage() {
  const { user, refreshUser } = useAuth()

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-[var(--lux-text)]">Settings</h1>
        <p className="mt-0.5 text-sm text-[var(--lux-muted)]">Manage your profile and local preferences</p>
      </div>

      {user && (
        <ProfileSettings
          key={`${user.id}:${user.updatedAt ?? ''}:${user.email}`}
          user={user}
          onSaved={refreshUser}
        />
      )}

      <PasswordSettings />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette size={15} />
            <h3 className="text-sm font-semibold text-[var(--lux-text)]">Preferences</h3>
          </div>
        </CardHeader>
        <CardBody className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-[var(--lux-text)]">Theme</p>
            <p className="text-sm text-[var(--lux-muted)]">Switch between light and dark mode</p>
          </div>
          <ThemeToggle />
        </CardBody>
      </Card>
    </div>
  )
}
