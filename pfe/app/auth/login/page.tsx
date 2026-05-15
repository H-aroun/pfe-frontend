'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { Mail, Lock, Eye, EyeOff, BookOpen } from 'lucide-react'
//import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { login } from '@/action/login'
import { ThemeToggle } from '@/components/theme/ThemeToggle'


const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const onSubmit = async (data: FormData) => {
    
    try {
      
      await login(data.email, data.password)
      
     
      toast.success('Logged in')
      router.push('/dashboard')}
      
    catch {
      toast.error('Incorrect email or password.')
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-[var(--lux-bg)] px-4 py-16 text-[var(--lux-text)]">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <ThemeToggle />
      </div>

      <Link href="/" className="mb-10 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--lux-primary)]">
          <BookOpen size={17} className="text-[var(--lux-text-strong)]" />
        </div>
        <span className="text-lg font-semibold text-[var(--lux-text-strong)]">
          EduScenario
        </span>
      </Link>

      <div className="w-full max-w-[400px]">
        <div className="rounded-2xl border border-[var(--lux-line)] bg-[var(--lux-surface)] p-6 shadow-[var(--lux-shadow)] sm:p-8">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-semibold text-[var(--lux-text-strong)]">
              Log in to EduScenario
            </h1>
            <p className="mt-2 text-sm text-[var(--lux-muted)]">
              Continue building learning scenarios.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
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

            <Input
              id="password"
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Your password"
              icon={<Lock size={14} />}
              error={errors.password?.message}
              autoComplete="current-password"
              iconRight={
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                    className="p-0.5 text-[var(--lux-muted-soft)] transition-colors hover:text-[var(--lux-text)]"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              {...register('password')}
            />

            <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
              Log in
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--lux-muted)]">
          {"Don't have an account? "}
          <Link
            href="/auth/register"
            className="font-semibold text-[var(--lux-gold)] transition-colors hover:opacity-80"
          >
            Create a free account
          </Link>
        </p>
      </div>
    </div>
  )
}
