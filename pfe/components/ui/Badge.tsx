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
  default: 'bg-[rgba(246,240,230,0.07)] text-[#D7CCBA] border-[rgba(246,240,230,0.12)]',
  success: 'bg-[#0F6B4A]/20 text-[#83BFA1] border-[#0F6B4A]/45',
  warning: 'bg-[#C6A765]/14 text-[#C6A765] border-[#C6A765]/35',
  danger: 'bg-red-500/12 text-red-400 border-red-500/25',
  info: 'bg-[#0F6B4A]/16 text-[#83BFA1] border-[#0F6B4A]/35',
  purple: 'bg-[#C6A765]/12 text-[#C6A765] border-[#C6A765]/30',
}

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-[#B9AD9C]',
  success: 'bg-[#83BFA1]',
  warning: 'bg-[#C6A765]',
  danger: 'bg-red-400',
  info: 'bg-[#83BFA1]',
  purple: 'bg-[#C6A765]',
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
    DRAFT: { label: 'Draft', variant: 'warning' },
    PUBLISHED: { label: 'Published', variant: 'success' },
    ARCHIVED: { label: 'Archived', variant: 'default' },
    TEACHER: { label: 'Teacher', variant: 'info' },
    ADMIN: { label: 'Admin', variant: 'purple' },
  }
  const cfg = map[status] ?? { label: status, variant: 'default' }
  return <Badge variant={cfg.variant} dot>{cfg.label}</Badge>
}
