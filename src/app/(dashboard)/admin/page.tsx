'use client'

import { useState } from 'react'
import { ShieldCheck, Layout, Lock, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { OUTPUT_TYPES } from '@/types'

// System blueprints derived from the actual canvas-renderer blueprints
const SYSTEM_BLUEPRINTS = [
  { id: 'sq-hero-left',    name: 'Square — Hero Left',      outputType: 'instagram_post',        style: 'image-led', isLocked: true  },
  { id: 'sq-text-center',  name: 'Square — Text Center',    outputType: 'instagram_post',        style: 'text-led',  isLocked: false },
  { id: 'sq-split',        name: 'Square — Split',          outputType: 'instagram_post',        style: 'split',     isLocked: false },
  { id: 'st-full-bleed',   name: 'Story — Full Bleed',      outputType: 'instagram_story',       style: 'image-led', isLocked: true  },
  { id: 'st-bottom-third', name: 'Story — Bottom Third',    outputType: 'instagram_story',       style: 'text-led',  isLocked: false },
  { id: 'ls-editorial',    name: 'Landscape — Editorial',   outputType: 'linkedin_post',         style: 'split',     isLocked: false },
  { id: 'ls-centered',     name: 'Landscape — Centered',    outputType: 'hero_banner',           style: 'image-led', isLocked: false },
  { id: 'pt-minimalist',   name: 'Portrait — Minimalist',   outputType: 'flyer',                 style: 'text-led',  isLocked: false },
]

const tabs = ['Blueprints', 'System'] as const

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Blueprints')
  const [locks, setLocks] = useState<Record<string, boolean>>(
    Object.fromEntries(SYSTEM_BLUEPRINTS.map(bp => [bp.id, bp.isLocked]))
  )

  const toggleLock = (id: string) =>
    setLocks(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="max-w-[1200px] animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Admin</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>Manage blueprints and system settings.</p>
        </div>
        <Badge variant="brand" dot>Owner</Badge>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 rounded-xl p-1 w-fit mb-6" style={{ background: 'var(--surface-muted)' }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={
              activeTab === tab
                ? { background: 'white', color: 'var(--fg)', boxShadow: 'var(--shadow-xs)' }
                : { color: 'var(--fg-muted)' }
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Blueprints' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              {SYSTEM_BLUEPRINTS.length} system blueprints — lock to prevent AI from selecting a layout
            </p>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Layout className="h-3.5 w-3.5" />
              Add Blueprint
            </Button>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            <div
              className="grid grid-cols-[2fr_1fr_1fr_100px] px-5 py-3 text-[10px] font-semibold uppercase tracking-widest"
              style={{ background: 'var(--surface-muted)', borderBottom: '1px solid var(--border)', color: 'var(--fg-subtle)' }}
            >
              <span>Blueprint</span>
              <span>Output Type</span>
              <span>Style</span>
              <span className="text-right">Lock</span>
            </div>

            {SYSTEM_BLUEPRINTS.map((bp, i) => {
              const outputType = OUTPUT_TYPES.find(t => t.id === bp.outputType)
              const isLocked = locks[bp.id]
              return (
                <div
                  key={bp.id}
                  className="grid grid-cols-[2fr_1fr_1fr_100px] px-5 py-3.5 items-center"
                  style={{
                    borderBottom: i < SYSTEM_BLUEPRINTS.length - 1 ? '1px solid var(--border-muted)' : 'none',
                    background: 'var(--surface)',
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-8 w-8 rounded-lg flex items-center justify-center text-base shrink-0"
                      style={{ background: 'var(--surface-muted)' }}
                    >
                      {outputType?.icon ?? '📐'}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{bp.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--fg-subtle)' }}>System blueprint</p>
                    </div>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
                    {outputType?.name ?? bp.outputType}
                  </span>
                  <Badge variant="secondary" className="w-fit capitalize">{bp.style}</Badge>
                  <div className="flex justify-end">
                    <button
                      onClick={() => toggleLock(bp.id)}
                      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                      style={{
                        background: isLocked ? 'var(--surface-inset)' : 'transparent',
                        color: isLocked ? 'var(--brand)' : 'var(--fg-subtle)',
                        border: `1px solid ${isLocked ? 'var(--brand-bg)' : 'var(--border)'}`,
                      }}
                    >
                      {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                      {isLocked ? 'Locked' : 'Unlocked'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'System' && (
        <div className="space-y-4">
          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#10b981' }} />
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: 'var(--fg)' }}>Webhook Security</p>
                <p className="text-xs mb-2" style={{ color: 'var(--fg-muted)' }}>
                  Clerk webhooks are verified via Svix signature. Set <code className="rounded px-1 text-[11px]" style={{ background: 'var(--surface-muted)' }}>CLERK_WEBHOOK_SECRET</code> in your environment to enable.
                </p>
                <Badge variant={process.env.NEXT_PUBLIC_APP_URL ? 'success' : 'warning'} dot>
                  {process.env.NEXT_PUBLIC_APP_URL ? 'Configured' : 'Pending configuration'}
                </Badge>
              </div>
            </div>
          </div>

          <div
            className="rounded-xl p-5"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>Rate Limits</p>
            <p className="text-xs mb-3" style={{ color: 'var(--fg-muted)' }}>In-memory limits per user. Replace with Redis-backed limiter for multi-instance deployments.</p>
            <div className="space-y-2">
              {[
                { route: 'POST /api/generate', limit: '20 req/min' },
                { route: 'POST /api/ai/copy-suggest', limit: '30 req/min' },
              ].map(({ route, limit }) => (
                <div key={route} className="flex items-center justify-between text-xs">
                  <code className="font-mono" style={{ color: 'var(--fg-muted)' }}>{route}</code>
                  <Badge variant="secondary">{limit}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
