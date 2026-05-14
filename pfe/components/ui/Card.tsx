'use client'

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  as?: 'div' | 'article' | 'section'
}

export function Card({ children, className, hover, onClick, as: Tag = 'div' }: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={cn(
        'bg-[#182420] border border-[rgba(246,240,230,0.12)] rounded-2xl',
        'shadow-[0_18px_48px_rgba(5,12,14,0.18)]',
        hover && 'transition-all duration-200 hover:border-[rgba(198,167,101,0.30)] hover:shadow-[0_26px_70px_rgba(5,12,14,0.28)] hover:-translate-y-0.5 cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </Tag>
  )
}

interface CardHeaderProps { children: ReactNode; className?: string }
export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn(
      'px-5 py-4 flex items-center justify-between',
      'border-b border-[rgba(246,240,230,0.10)]',
      className
    )}>
      {children}
    </div>
  )
}

interface CardBodyProps { children: ReactNode; className?: string }
export function CardBody({ children, className }: CardBodyProps) {
  return (
    <div className={cn('px-5 py-4', className)}>
      {children}
    </div>
  )
}
