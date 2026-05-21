/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Lock, Save } from 'lucide-react'
import { usersApi } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { ChangePassword } from '@/action/changePassword'
const profileSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
})

const changeSchema = z.object({
  currentPassword: z.string().min(6, 'Current Password must be at least 6 characters'),
  newPassword: z.string().min(6, 'New Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters'),
})

type ProfileForm = z.infer<typeof profileSchema>

type ChangePassForm = z.infer<typeof changeSchema>

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<'profile' | 'security'>('security')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: user?.firstName ?? '', lastName: user?.lastName ?? '', email: user?.email ?? '' },
  })

  const { register : registerChange, handleSubmit: handleSubmitChange, formState: { errors: errorsChange, isSubmitting: isSubmittingChange } } = useForm<ChangePassForm>({
    resolver: zodResolver(changeSchema),
  })

  const { mutate: updateProfile } = useMutation({
    mutationFn: (data: Partial<ProfileForm>) => usersApi.updateMe(data),
    onSuccess: () => toast.success('Profile updated!'),
    onError: () => toast.error('Update failed'),
  })


const changePassword = async (data: ChangePassForm) => {
  try {
    const res = await ChangePassword(data);

    toast.success(res.message);

  } catch (error: any) {

    toast.error(
      error.message || "Change Password Failed!"
    );

    console.log(error);
  }
};
  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your account preferences</p>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 bg-white/5 border border-white/8 rounded-xl p-1 w-fit">
        {[{ id: 'profile' as const, label: 'Profile', icon: User }, { id: 'security' as const, label: 'Security', icon: Lock }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${tab === t.id ? 'bg-[#0F6B4A] text-[#FFF8EC]' : 'text-slate-400 hover:text-slate-200'}`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {tab === 'profile' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-200">Profile Information</h3>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4 mb-6">
              <Avatar firstName={user?.firstName} lastName={user?.lastName} size="xl" />
              <div>
                <p className="font-semibold text-slate-100">{user?.lastName} {user?.firstName}</p>
                <p className="text-sm text-slate-500">{user?.email}</p>
                <div className="mt-1">{user?.role?.name && <StatusBadge status={user.role?.name} />}</div>
              </div>
            </div>
            <form onSubmit={handleSubmit(d => updateProfile(d))} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input id="set-fn" label="First name" error={errors.firstName?.message} {...register('firstName')} />
                <Input id="set-ln" label="Last name" error={errors.lastName?.message} {...register('lastName')} />
              </div>
              <Input id="set-email" label="Email" type="email" error={errors.email?.message} {...register('email')} />
              <Button type="submit" size="sm" loading={isSubmitting}>
                <Save size={13} className="mr-1" /> Save changes
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {tab === 'security' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-slate-200">Security</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <form onSubmit={handleSubmitChange(d => changePassword(d))} className="space-y-4">
                <Input id="cur-pass" label="Current password" error={errorsChange?.currentPassword?.message} {...registerChange('currentPassword')} type="password" placeholder="••••••••" />
                <Input id="new-pass" label="New password" error={errorsChange?.newPassword?.message} {...registerChange('newPassword')} type="password" placeholder="Min. 8 characters" />
                <Input id="conf-pass" label="Confirm new password" error={errorsChange?.confirmPassword?.message} {...registerChange('confirmPassword')} type="password" placeholder="••••••••" />
                <Button type='submit' size="sm" loading={isSubmittingChange}>
                  <Save size={13} className="mr-1" /> Update password
                </Button>
              </form>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
