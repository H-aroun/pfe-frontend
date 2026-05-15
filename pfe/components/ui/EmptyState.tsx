'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-2xl bg-[var(--lux-surface-soft)] border border-[var(--lux-line)] flex items-center justify-center text-[var(--lux-gold)] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--lux-text)] mb-1">{title}</h3>
      {description && <p className="text-sm text-[var(--lux-muted-soft)] max-w-xs mb-5">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  )
}
