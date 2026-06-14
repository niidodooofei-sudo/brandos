import * as React from 'react'
import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  label?: string
  showValue?: boolean
}

export function Progress({ value, max = 100, className, barClassName, label, showValue }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="flex justify-between mb-1">
          {label && <span className="text-xs text-neutral-600">{label}</span>}
          {showValue && <span className="text-xs text-neutral-500">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('h-2 w-full rounded-full bg-neutral-100 overflow-hidden', className)}>
        <div
          className={cn('h-full rounded-full bg-neutral-900 transition-all duration-500', barClassName)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
