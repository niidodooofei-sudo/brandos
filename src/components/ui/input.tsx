import * as React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  charCount?: number
  maxChars?: number
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, charCount, maxChars, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400',
              'focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent',
              'disabled:bg-neutral-50 disabled:text-neutral-400 disabled:cursor-not-allowed',
              error && 'border-red-400 focus:ring-red-400',
              className
            )}
            {...props}
          />
          {maxChars !== undefined && (
            <span className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-xs',
              (charCount || 0) > maxChars * 0.9 ? 'text-orange-500' : 'text-neutral-400'
            )}>
              {charCount || 0}/{maxChars}
            </span>
          )}
        </div>
        {hint && !error && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
