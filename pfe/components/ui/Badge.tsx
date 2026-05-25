'use client'

import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--lux-surface-soft)] text-[var(--lux-text)] border-[var(--lux-line)]',
  success: 'bg-[var(--lux-primary-soft)] text-[var(--lux-primary-muted)] border-[var(--lux-primary)]',
  warning: 'bg-[var(--lux-gold-soft)] text-[var(--lux-gold)] border-[var(--lux-line-strong)]',
  danger: 'bg-red-500/12 text-red-400 border-red-500/25',
  info: 'bg-[var(--lux-primary-soft)] text-[var(--lux-primary-muted)] border-[var(--lux-primary)]',
  purple: 'bg-[var(--lux-gold-soft)] text-[var(--lux-gold)] border-[var(--lux-line-strong)]',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[var(--lux-muted)]',
  success: 'bg-[var(--lux-primary-muted)]',
  warning: 'bg-[var(--lux-gold)]',
  danger: 'bg-red-400',
  info: 'bg-[var(--lux-primary-muted)]',
  purple: 'bg-[var(--lux-gold)]',
}

export function Badge({ children, variant = 'default', size = 'sm', className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 border font-medium rounded-full',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dotColors[variant])} />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: BadgeVariant }> = {
    BROUILLON: { label: 'Draft', variant: 'warning' },
    EN_COURS_VALIDATION: { label: 'In review', variant: 'info' },
    APPROUVE: { label: 'Approved', variant: 'success' },
    EXPORTE: { label: 'Exported', variant: 'purple' },
    ARCHIVE: { label: 'Archived', variant: 'default' },
    DRAFT: { label: 'Draft', variant: 'warning' },
    PUBLISHED: { label: 'Published', variant: 'success' },
    ARCHIVED: { label: 'Archived', variant: 'default' },
    TEACHER: { label: 'Teacher', variant: 'info' },
    ADMIN: { label: 'Admin', variant: 'purple' },
  }
  const cfg = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}
