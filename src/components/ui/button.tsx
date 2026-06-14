'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-[var(--fg)] text-white hover:opacity-85 active:opacity-75 shadow-[var(--shadow-xs)] focus-visible:ring-[var(--fg)]',
        secondary:
          'bg-[var(--surface-muted)] text-[var(--fg)] hover:bg-[var(--surface-inset)] active:bg-[var(--border)] focus-visible:ring-[var(--fg)]',
        outline:
          'border border-[var(--border)] bg-white text-[var(--fg)] hover:bg-[var(--surface-muted)] shadow-[var(--shadow-xs)] focus-visible:ring-[var(--brand)]',
        ghost:
          'text-[var(--fg-muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--fg)] focus-visible:ring-[var(--brand)]',
        destructive:
          'bg-rose-500 text-white hover:bg-rose-600 shadow-[var(--shadow-xs)] focus-visible:ring-rose-500',
        brand:
          'bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)] shadow-[0_1px_4px_rgba(124,58,237,0.35)] focus-visible:ring-[var(--brand)]',
        success:
          'bg-emerald-600 text-white hover:bg-emerald-700 shadow-[var(--shadow-xs)] focus-visible:ring-emerald-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        default: 'h-9 px-4 py-2',
        lg: 'h-10 px-5 text-sm',
        xl: 'h-11 px-7 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
