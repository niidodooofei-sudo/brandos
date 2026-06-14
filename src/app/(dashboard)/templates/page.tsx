'use client'

import { useState, useEffect } from 'react'
import { Plus, Layout, Image, Type, AlignLeft, MousePointerClick, Star, Trash2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TemplateBuilder, type CustomTemplate, type ZoneType, ZONE_META } from '@/components/templates/template-builder'

// System blueprints shown as built-in templates
const SYSTEM_TEMPLATES = [
  {
    id: 'sys_hero_left',
    name: 'Hero Left',
    desc: 'Large image left, headline and CTA right',
    zones: [
      { type: 'photo' as ZoneType, x: 0, y: 0, w: 0.55, h: 1 },
      { type: 'headline' as ZoneType, x: 0.58, y: 0.2, w: 0.37, h: 0.25 },
      { type: 'subheadline' as ZoneType, x: 0.58, y: 0.48, w: 0.37, h: 0.15 },
      { type: 'cta' as ZoneType, x: 0.58, y: 0.7, w: 0.2, h: 0.1 },
      { type: 'logo' as ZoneType, x: 0.58, y: 0.05, w: 0.12, h: 0.1 },
    ],
    category: 'Landscape',
    color: '#7c3aed',
  },
  {
    id: 'sys_centered',
    name: 'Centered Impact',
    desc: 'Full-bleed image, centered text overlay',
    zones: [
      { type: 'photo' as ZoneType, x: 0, y: 0, w: 1, h: 1 },
      { type: 'headline' as ZoneType, x: 0.1, y: 0.35, w: 0.8, h: 0.2 },
      { type: 'subheadline' as ZoneType, x: 0.15, y: 0.58, w: 0.7, h: 0.12 },
      { type: 'logo' as ZoneType, x: 0.42, y: 0.08, w: 0.16, h: 0.12 },
    ],
    category: 'Square',
    color: '#0ea5e9',
  },
  {
    id: 'sys_story_stack',
    name: 'Story Stack',
    desc: 'Vertical stack for stories and reels',
    zones: [
      { type: 'logo' as ZoneType, x: 0.05, y: 0.04, w: 0.18, h: 0.06 },
      { type: 'photo' as ZoneType, x: 0, y: 0.12, w: 1, h: 0.52 },
      { type: 'headline' as ZoneType, x: 0.05, y: 0.68, w: 0.9, h: 0.15 },
      { type: 'body' as ZoneType, x: 0.05, y: 0.84, w: 0.7, h: 0.08 },
      { type: 'cta' as ZoneType, x: 0.05, y: 0.93, w: 0.35, h: 0.06 },
    ],
    category: 'Story',
    color: '#10b981',
  },
  {
    id: 'sys_minimal',
    name: 'Minimalist',
    desc: 'White space with typography focus',
    zones: [
      { type: 'logo' as ZoneType, x: 0.04, y: 0.05, w: 0.15, h: 0.09 },
      { type: 'headline' as ZoneType, x: 0.04, y: 0.3, w: 0.6, h: 0.25 },
      { type: 'body' as ZoneType, x: 0.04, y: 0.6, w: 0.55, h: 0.15 },
      { type: 'cta' as ZoneType, x: 0.04, y: 0.8, w: 0.22, h: 0.1 },
    ],
    category: 'Square',
    color: '#6b7280',
  },
  {
    id: 'sys_split',
    name: 'Split Color',
    desc: 'Brand color block with content panel',
    zones: [
      { type: 'photo' as ZoneType, x: 0, y: 0, w: 0.45, h: 1 },
      { type: 'headline' as ZoneType, x: 0.5, y: 0.15, w: 0.44, h: 0.3 },
      { type: 'body' as ZoneType, x: 0.5, y: 0.5, w: 0.44, h: 0.2 },
      { type: 'cta' as ZoneType, x: 0.5, y: 0.75, w: 0.22, h: 0.1 },
      { type: 'logo' as ZoneType, x: 0.78, y: 0.05, w: 0.18, h: 0.08 },
    ],
    category: 'Landscape',
    color: '#f59e0b',
  },
  {
    id: 'sys_linkedin',
    name: 'LinkedIn Card',
    desc: 'Professional layout for LinkedIn posts',
    zones: [
      { type: 'logo' as ZoneType, x: 0.03, y: 0.04, w: 0.12, h: 0.1 },
      { type: 'headline' as ZoneType, x: 0.03, y: 0.18, w: 0.94, h: 0.28 },
      { type: 'body' as ZoneType, x: 0.03, y: 0.5, w: 0.94, h: 0.22 },
      { type: 'cta' as ZoneType, x: 0.03, y: 0.78, w: 0.3, h: 0.1 },
      { type: 'photo' as ZoneType, x: 0.7, y: 0.04, w: 0.26, h: 0.25 },
    ],
    category: 'Landscape',
    color: '#0ea5e9',
  },
]

const ZONE_ICONS: Record<ZoneType, React.ElementType> = {
  photo: Image,
  headline: Type,
  subheadline: Type,
  body: AlignLeft,
  cta: MousePointerClick,
  logo: Star,
}

function ZonePreview({ zones, color }: { zones: Array<{ type: ZoneType; x: number; y: number; w: number; h: number }>; color: string }) {
  return (
    <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
      {zones.map((z, i) => {
        const meta = ZONE_META[z.type]
        return (
          <div
            key={i}
            className="absolute rounded-sm"
            style={{
              left: `${z.x * 100}%`,
              top: `${z.y * 100}%`,
              width: `${z.w * 100}%`,
              height: `${z.h * 100}%`,
              background: meta.bg,
              border: `1.5px solid ${meta.border}60`,
            }}
          />
        )
      })}
    </div>
  )
}

function TemplateCard({
  template,
  isSystem = false,
  onDelete,
}: {
  template: typeof SYSTEM_TEMPLATES[0] | CustomTemplate
  isSystem?: boolean
  onDelete?: () => void
}) {
  const isCustom = !isSystem
  const zones = 'zones' in template ? template.zones : []
  const color = 'color' in template ? template.color : '#7c3aed'
  const name = template.name
  const desc = 'desc' in template ? template.desc : `${zones.length} zones`
  const category = 'category' in template ? template.category : 'Custom'

  return (
    <div
      className="rounded-xl bg-white overflow-hidden lift-card"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="p-4 pb-3">
        <ZonePreview zones={zones as Array<{ type: ZoneType; x: number; y: number; w: number; h: number }>} color={color} />
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="text-sm font-semibold leading-tight" style={{ color: 'var(--fg)' }}>{name}</p>
          {isCustom && onDelete && (
            <button
              onClick={onDelete}
              className="h-6 w-6 rounded flex items-center justify-center shrink-0 transition-colors"
              style={{ color: 'var(--fg-subtle)' }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'; (e.currentTarget as HTMLButtonElement).style.background = '#fff1f2' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-subtle)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <p className="text-xs mb-3 leading-relaxed" style={{ color: 'var(--fg-muted)' }}>{desc}</p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {zones.slice(0, 4).map((z, i) => {
              const meta = ZONE_META[(z as { type: ZoneType }).type]
              const Icon = ZONE_ICONS[(z as { type: ZoneType }).type]
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 text-[10px] rounded-full px-1.5 py-0.5 font-medium"
                  style={{ background: meta.bg, color: meta.color }}
                >
                  <Icon className="h-2.5 w-2.5" />
                  {meta.label}
                </span>
              )
            })}
            {zones.length > 4 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ color: 'var(--fg-subtle)', background: 'var(--surface-muted)' }}>
                +{zones.length - 4}
              </span>
            )}
          </div>
          <Badge variant={isSystem ? 'secondary' : 'brand'} className="text-[10px]">
            {isSystem ? category : 'Custom'}
          </Badge>
        </div>
      </div>
    </div>
  )
}

const LS_KEY = 'brandos:custom-templates'

export default function TemplatesPage() {
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([])
  const [showBuilder, setShowBuilder] = useState(false)
  const [tab, setTab] = useState<'system' | 'custom'>('system')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setCustomTemplates(JSON.parse(saved))
    } catch {}
  }, [])

  const saveTemplate = (tpl: CustomTemplate) => {
    setCustomTemplates(prev => {
      const next = [...prev, tpl]
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
    setShowBuilder(false)
    setTab('custom')
  }

  const deleteTemplate = (id: string) => {
    setCustomTemplates(prev => {
      const next = prev.filter(t => t.id !== id)
      localStorage.setItem(LS_KEY, JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="max-w-[1200px] animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Templates</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            System layouts and your custom templates. Upload any image and define photo, text, and logo zones.
          </p>
        </div>
        <Button variant="brand" className="gap-2" onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4" />
          Upload Template
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0' }}>
        {([
          { key: 'system', label: `System (${SYSTEM_TEMPLATES.length})` },
          { key: 'custom', label: `Custom (${customTemplates.length})` },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-4 py-2.5 text-sm font-medium transition-colors relative"
            style={{
              color: tab === key ? 'var(--brand)' : 'var(--fg-muted)',
              background: 'transparent',
              border: 'none',
            }}
          >
            {label}
            {tab === key && (
              <span
                className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ background: 'var(--brand)' }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      {tab === 'system' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {SYSTEM_TEMPLATES.map(tpl => (
            <TemplateCard key={tpl.id} template={tpl} isSystem />
          ))}
        </div>
      )}

      {tab === 'custom' && (
        customTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
            <div
              className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface-muted)' }}
            >
              <Layout className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--fg)' }}>No custom templates yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--fg-muted)' }}>
                Upload a template image and define content zones — BrandOS will fill them in when generating.
              </p>
            </div>
            <Button variant="brand" className="gap-2 mt-2" onClick={() => setShowBuilder(true)}>
              <Plus className="h-4 w-4" />
              Create Your First Template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {customTemplates.map(tpl => (
              <TemplateCard key={tpl.id} template={tpl} onDelete={() => deleteTemplate(tpl.id)} />
            ))}
            <button
              onClick={() => setShowBuilder(true)}
              className="rounded-xl flex flex-col items-center justify-center gap-3 min-h-[220px] lift-card"
              style={{ border: '2px dashed var(--border)', color: 'var(--fg-subtle)' }}
              onMouseEnter={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brand-light)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--brand)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--brand-bg)'
              }}
              onMouseLeave={e => {
                ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'
                ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-subtle)'
                ;(e.currentTarget as HTMLButtonElement).style.background = 'transparent'
              }}
            >
              <div className="h-10 w-10 rounded-xl border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'currentColor' }}>
                <Plus className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium">Upload Template</p>
            </button>
          </div>
        )
      )}

      {showBuilder && (
        <TemplateBuilder
          onSave={saveTemplate}
          onCancel={() => setShowBuilder(false)}
        />
      )}
    </div>
  )
}
