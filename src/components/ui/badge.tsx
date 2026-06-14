import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-[var(--fg)] text-white',
        secondary: 'bg-[var(--surface-muted)] text-[var(--fg-muted)]',
        outline: 'border border-[var(--border)] text-[var(--fg-muted)]',
        success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60',
        warning: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/60',
        danger: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200/60',
        brand: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200/60',
        info: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200/60',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{
            background:
              variant === 'success' ? '#10b981'
              : variant === 'warning' ? '#f59e0b'
              : variant === 'danger' ? '#f43f5e'
              : variant === 'brand' ? '#7c3aed'
              : variant === 'info' ? '#0ea5e9'
              : 'currentColor',
          }}
        />
      )}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
