'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useBrand } from '@/contexts/brand-context'
import {
  LayoutDashboard,
  PlusSquare,
  Library,
  Megaphone,
  Dna,
  BarChart2,
  Settings,
  ShieldCheck,
  Zap,
  Layout,
  ChevronDown,
  Plus,
  Check,
  Layers,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/create', label: 'Create', icon: PlusSquare },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/templates', label: 'Templates', icon: Layout },
  { href: '/brand', label: 'Brand DNA', icon: Dna },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
]

const bottomItems = [
  { href: '/admin', label: 'Admin', icon: ShieldCheck },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { brands, activeBrand, setActiveBrand } = useBrand()
  const [switcherOpen, setSwitcherOpen] = useState(false)

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[240px] flex flex-col z-30 select-none"
      style={{ background: 'linear-gradient(175deg, #08070f 0%, #0d0b1e 60%, #0f0c22 100%)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2.5 px-4 h-14 shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.055)' }}
      >
        <div
          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
          style={{
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
            boxShadow: '0 0 16px rgba(124,58,237,0.55)',
          }}
        >
          <Zap className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-[15px] font-semibold tracking-tight text-white">BrandOS</span>
        <span
          className="ml-auto text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
          style={{ color: '#a78bfa', background: 'rgba(124,58,237,0.2)' }}
        >
          Pro
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2.5">
        <ul className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                    active ? 'text-violet-300' : 'text-white/35 hover:text-white/70'
                  )}
                  style={
                    active
                      ? { background: 'rgba(124,58,237,0.16)', color: '#c4b5fd' }
                      : undefined
                  }
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  }}
                >
                  <Icon
                    className="h-[15px] w-[15px] shrink-0 transition-colors"
                    style={{ color: active ? '#a78bfa' : undefined }}
                  />
                  <span className="flex-1">{label}</span>
                  {active && (
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#8b5cf6' }} />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Bottom section */}
        <div className="mt-4 pt-3.5 space-y-0.5" style={{ borderTop: '1px solid rgba(255,255,255,0.055)' }}>
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
            Workspace
          </p>
          {bottomItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                  active ? 'text-violet-300' : 'text-white/25 hover:text-white/55'
                )}
                style={active ? { background: 'rgba(124,58,237,0.16)', color: '#c4b5fd' } : undefined}
                onMouseEnter={e => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)'
                }}
                onMouseLeave={e => {
                  if (!active) (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                }}
              >
                <Icon className="h-[15px] w-[15px] shrink-0" style={{ color: active ? '#a78bfa' : undefined }} />
                {label}
              </Link>
            )
          })}

          <Link
            href="/brands"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 text-white/25 hover:text-white/55"
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.03)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
          >
            <Layers className="h-[15px] w-[15px] shrink-0" />
            All Brands
          </Link>
        </div>
      </nav>

      {/* Brand switcher */}
      <div className="px-2.5 pb-3.5 relative">
        {switcherOpen && (
          <div
            className="absolute bottom-full left-0 right-0 mx-2.5 mb-2 rounded-xl overflow-hidden animate-slide-down"
            style={{
              background: '#120f2a',
              border: '1px solid rgba(255,255,255,0.10)',
              boxShadow: '0 -12px 40px rgba(0,0,0,0.5)',
            }}
          >
            <p
              className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Switch Brand
            </p>
            <div className="px-1.5 pb-1.5 space-y-0.5">
              {brands.map(brand => (
                <button
                  key={brand.id}
                  onClick={() => { setActiveBrand(brand); setSwitcherOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors"
                  style={{ color: 'rgba(255,255,255,0.65)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <div
                    className="h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                    style={{ background: brand.color }}
                  >
                    {brand.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {brand.name}
                    </p>
                    {brand.industry && (
                      <p className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {brand.industry}
                      </p>
                    )}
                  </div>
                  {brand.id === activeBrand?.id && (
                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#a78bfa' }} />
                  )}
                </button>
              ))}
            </div>
            <div className="px-1.5 pb-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link
                href="/brands"
                onClick={() => setSwitcherOpen(false)}
                className="flex items-center gap-2 w-full rounded-lg px-2.5 py-2 text-[13px] transition-colors mt-1.5"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.65)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                  ;(e.currentTarget as HTMLAnchorElement).style.color = 'rgba(255,255,255,0.35)'
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Manage Brands
              </Link>
            </div>
          </div>
        )}

        {activeBrand ? (
          <button
            onClick={() => setSwitcherOpen(o => !o)}
            className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-all text-left"
            style={{
              background: switcherOpen ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${switcherOpen ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}
          >
            <div
              className="h-6 w-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white shrink-0"
              style={{ background: activeBrand.color }}
            >
              {activeBrand.initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {activeBrand.name}
              </p>
              <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>Active Brand</p>
            </div>
            <ChevronDown
              className="h-3.5 w-3.5 shrink-0 transition-transform duration-200"
              style={{ color: 'rgba(255,255,255,0.3)', transform: switcherOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
            />
          </button>
        ) : (
          <Link
            href="/brands"
            className="w-full rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-all"
            style={{ background: 'rgba(124,58,237,0.10)', border: '1px dashed rgba(124,58,237,0.3)' }}
          >
            <div className="h-6 w-6 rounded-md border border-dashed flex items-center justify-center text-[14px] shrink-0" style={{ borderColor: 'rgba(124,58,237,0.5)' }}>
              +
            </div>
            <p className="text-[13px] font-medium" style={{ color: '#a78bfa' }}>Add your first brand</p>
          </Link>
        )}
      </div>
    </aside>
  )
}
