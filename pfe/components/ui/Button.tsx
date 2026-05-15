'use client'

import { cn } from '@/lib/utils'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  children?: ReactNode
}

const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:   'bg-[var(--lux-primary)] hover:bg-[var(--lux-primary-hover)] text-[var(--lux-text-strong)] border-[var(--lux-primary)] hover:border-[var(--lux-primary-hover)] shadow-[0_12px_30px_rgba(5,12,14,0.22)]',
  secondary: 'bg-[var(--lux-surface-soft)] hover:bg-[var(--lux-elevated)] text-[var(--lux-text)] border-[var(--lux-line)] hover:border-[var(--lux-line-strong)]',
  ghost:     'bg-transparent hover:bg-[var(--lux-primary-soft)] text-[var(--lux-muted)] border-transparent',
  danger:    'bg-red-600/15 hover:bg-red-600/25 text-red-400 border-red-500/30 hover:border-red-500/50',
  outline:   'bg-transparent hover:bg-[var(--lux-primary-soft)] text-[var(--lux-text)] border-[var(--lux-line)] hover:border-[var(--lux-line-strong)]',
}

const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
  sm:   'h-8 px-3.5 text-xs rounded-full gap-1.5',
  md:   'h-10 px-5 text-sm rounded-full gap-2',
  lg:   'h-12 px-7 text-[15px] rounded-full gap-2',
  icon: 'h-10 w-10 rounded-full',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center border font-semibold',
        'transition-all duration-150 cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lux-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && (
        <svg
          className="h-4 w-4 animate-spin flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
}
