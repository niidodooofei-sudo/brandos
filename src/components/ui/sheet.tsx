'use client'

import * as React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

const Sheet = Dialog.Root
const SheetClose = Dialog.Close

function SheetContent({ className, children, ...props }: React.ComponentProps<typeof Dialog.Content>) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay
        className="fixed inset-0 z-40 animate-fade-up"
        style={{ background: 'rgba(10, 6, 30, 0.35)' }}
      />
      <Dialog.Content
        className={cn(
          'fixed right-0 top-0 z-50 h-screen w-full max-w-[480px] overflow-y-auto bg-white p-6',
          className
        )}
        style={{ boxShadow: 'var(--shadow-xl)' }}
        {...props}
      >
        <Dialog.Close
          className="absolute right-4 top-4 rounded-lg p-1.5 transition-colors hover:bg-[var(--surface-muted)]"
          aria-label="Close"
        >
          <X className="h-4 w-4" style={{ color: 'var(--fg-muted)' }} />
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  )
}

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 pr-8', className)} {...props} />
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof Dialog.Title>) {
  return (
    <Dialog.Title
      className={cn('text-lg font-semibold tracking-tight', className)}
      style={{ color: 'var(--fg)' }}
      {...props}
    />
  )
}

export { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose }
