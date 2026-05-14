'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import type { InputHTMLAttributes, ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  iconRight?: ReactNode
}

/**
 * Input component with icon support.
 *
 * WHY inline style for padding:
 * Tailwind v4 JIT won't generate `pl-10` / `pl-11` etc. when the class name
 * only appears inside a ternary expression in cn() — the scanner needs a full
 * literal string to emit the rule. Using React's `style` prop bypasses JIT
 * entirely and guarantees the correct pixel offset at runtime.
 *
 * Icon geometry:
 *   • Icon span:  left-0 + pl-3.5 (14 px) → icon starts at 14 px
 *   • Icon size:  14 px → icon right-edge at 28 px
 *   • Input padding-left with icon: 44 px → 16 px gap between icon and text ✓
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, hint, icon, iconRight, className, id, style, ...props },
    ref
  ) {
    // Padding computed here, NOT via Tailwind, to guarantee JIT-safe rendering
    const paddingLeft  = icon      ? '2.75rem' : '1rem'  // 44px : 16px
    const paddingRight = iconRight ? '2.75rem' : '1rem'  // 44px : 16px

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-[#D7CCBA]">
            {label}
          </label>
        )}

        <div className="relative">
          {/* Left icon — absolutely centred, pointer-events disabled */}
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#8E9C93]">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={id}
            /* Inline style is the source of truth for horizontal padding */
            style={{ paddingLeft, paddingRight, ...style }}
            className={cn(
              // Base layout & colour
              'w-full rounded-xl border bg-[#182420] text-sm text-[#F6F0E6]',
              'placeholder:text-[#8E9C93]',
              'h-11 transition-all duration-150',
              // Focus ring
              'focus:outline-none focus:border-[#0F6B4A] focus:ring-2 focus:ring-[#0F6B4A]/25',
              // Validation states
              error
                ? 'border-[#EF4444]/50 focus:border-[#EF4444] focus:ring-[#EF4444]/20'
                : 'border-[rgba(246,240,230,0.12)]',
              // Disabled
              'disabled:opacity-50 disabled:cursor-not-allowed',
              className
            )}
            {...props}
          />

          {/* Right icon */}
          {iconRight && (
            <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8E9C93]">
              {iconRight}
            </span>
          )}
        </div>

        {/* Validation error */}
        {error && (
          <p role="alert" className="flex items-center gap-1 text-xs text-[#EF4444]">
            {error}
          </p>
        )}
        {/* Hint (shown only when no error) */}
        {hint && !error && (
          <p className="text-xs text-[#8E9C93]">{hint}</p>
        )}
      </div>
    )
  }
)
