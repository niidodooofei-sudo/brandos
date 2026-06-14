'use client'

import { Bell, Search, User, Command } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function Topbar({ title }: { title?: string }) {
  return (
    <header
      className="fixed top-0 left-[240px] right-0 h-14 z-20 flex items-center justify-between px-6"
      style={{
        background: 'rgba(247,246,255,0.88)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-3">
        {title && (
          <h1 className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>{title}</h1>
        )}
        <div className="relative hidden md:flex items-center">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
            style={{ color: 'var(--fg-subtle)' }}
          />
          <input
            type="search"
            placeholder="Search assets, campaigns…"
            className="pl-9 pr-20 py-1.5 text-sm rounded-lg focus:outline-none transition-shadow w-56 focus:w-64"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--fg)',
              boxShadow: 'var(--shadow-xs)',
            }}
          />
          <kbd
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-[10px] pointer-events-none"
            style={{ color: 'var(--fg-subtle)' }}
          >
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Link href="/create">
          <Button
            size="sm"
            className="gap-1.5 rounded-lg text-xs font-semibold px-3"
            style={{ background: 'var(--brand)', color: '#fff' }}
          >
            <span className="text-sm font-bold leading-none">+</span>
            Create
          </Button>
        </Link>

        <button
          className="relative rounded-lg p-2 transition-colors"
          style={{ color: 'var(--fg-muted)' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <Bell className="h-4 w-4" />
          <span
            className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full animate-pulse-dot"
            style={{ background: 'var(--brand)' }}
          />
        </button>

        <div
          className="h-8 w-8 rounded-full flex items-center justify-center cursor-pointer ml-0.5"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' }}
        >
          <User className="h-4 w-4 text-white" />
        </div>
      </div>
    </header>
  )
}
