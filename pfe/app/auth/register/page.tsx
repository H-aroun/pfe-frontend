'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Mail, Lock, User, Eye, EyeOff, BookOpen } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { cn } from '@/lib/utils'

const schema = z.object({
  firstName: z.string().min(2, 'Please enter your first name'),
  lastName: z.string().min(2, 'Please enter your last name'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Use at least 8 characters'),
})
type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const password = useWatch({ control, name: 'password' }) ?? ''
  const pwStrength = !password.length ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3
  const strengthMap = [
    null,
    { label: 'Weak', cls: 'bg-[#EF4444]' },
    { label: 'Fair', cls: 'bg-[#C6A765]' },
    { label: 'Strong', cls: 'bg-[#14B8A6]' },
  ]

  const onSubmit = async (data: FormData) => {
    try {
      await registerUser(data)
      toast.success('Account created')
      router.push('/auth/login')
    } catch {
      toast.error('Registration failed. This email may already be in use.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#111A1F] px-4 py-16 text-[#F6F0E6]">
      <Link href="/" className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F6B4A]">
          <BookOpen size={17} className="text-[#FFF8EC]" />
        </div>
        <span className="text-lg font-semibold text-[#FFF8EC]">
          EduScenario
        </span>
      </Link>

      <div className="w-full max-w-[480px]">
        <div className="rounded-2xl border border-[rgba(246,240,230,0.14)] bg-[#182420] p-6 shadow-[0_24px_70px_rgba(5,12,14,0.28)] sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-[#FFF8EC]">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-[#B9AD9C]">
              Start building learning scenarios.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                id="firstName"
                label="First name"
                placeholder="Jane"
                icon={<User size={13} />}
                error={errors.firstName?.message}
                autoComplete="given-name"
                {...register('firstName')}
              />
              <Input
                id="lastName"
                label="Last name"
                placeholder="Doe"
                error={errors.lastName?.message}
                autoComplete="family-name"
                {...register('lastName')}
              />
            </div>

            <Input
              id="email"
              label="Email address"
              type="email"
              placeholder="you@institution.edu"
              icon={<Mail size={14} />}
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />

            <div className="space-y-2">
              <Input
                id="password"
                label="Password"
                type={showPass ? 'text' : 'password'}
                placeholder="At least 8 characters"
                icon={<Lock size={14} />}
                error={errors.password?.message}
                autoComplete="new-password"
                iconRight={
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    className="p-0.5 text-[#8E9C93] transition-colors hover:text-[#F6F0E6]"
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                }
                {...register('password')}
              />

              {password.length > 0 && (
                <div className="flex items-center gap-2">
                  <div className="flex flex-1 gap-1">
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={cn(
                          'h-1 flex-1 rounded-full transition-all duration-300',
                          i <= pwStrength ? strengthMap[pwStrength]!.cls : 'bg-[rgba(246,240,230,0.10)]'
                        )}
                      />
                    ))}
                  </div>
                  <span className="w-10 text-right text-[11px] text-[#8E9C93]">
                    {strengthMap[pwStrength]?.label}
                  </span>
                </div>
              )}
            </div>

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[#B9AD9C]">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-[#C6A765] transition-colors hover:text-[#D7BD7A]"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
