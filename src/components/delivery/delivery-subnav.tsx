'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/delivery', label: 'Board' },
  { href: '/delivery/asset-bank', label: 'Asset Bank' },
  { href: '/delivery/reports', label: 'Reports' },
]

export function DeliverySubnav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 mb-5 border-b" style={{ borderColor: 'var(--border)' }}>
      {TABS.map((tab) => {
        const active = pathname === tab.href
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
              active ? 'border-current' : 'border-transparent'
            )}
            style={{ color: active ? 'var(--brand)' : 'var(--fg-muted)' }}
          >
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
