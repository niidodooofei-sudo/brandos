'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Circle, ChevronRight, Upload, Palette, Type, Layout, Eye, Volume2, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { BrandDNAForm } from '@/components/brand/brand-dna-form'
import { BrandUploadZone } from '@/components/brand/brand-upload-zone'
import { useBrand } from '@/contexts/brand-context'
import { cn } from '@/lib/utils'

const sections = [
  { id: 'upload',     label: 'Upload Guidelines', icon: Upload,    description: 'Upload your brand guideline PDF for AI extraction' },
  { id: 'typography', label: 'Typography',         icon: Type,      description: 'Fonts, weights, and type scale' },
  { id: 'colors',     label: 'Colors',             icon: Palette,   description: 'Primary, secondary, accent, and background' },
  { id: 'layout',     label: 'Layout Style',       icon: Layout,    description: 'Grid system and layout preferences' },
  { id: 'visual',     label: 'Visual Style',       icon: Eye,       description: 'Photography, illustration, and image treatment' },
  { id: 'voice',      label: 'Voice & Tone',       icon: Volume2,   description: 'Brand personality and copy rules' },
  { id: 'logo',       label: 'Logo & Assets',      icon: ImageIcon, description: 'Logo files and clearance rules' },
]

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeCompletion(dna: Record<string, any> | null): Record<string, boolean> {
  if (!dna) return Object.fromEntries(sections.map(s => [s.id, false]))
  const colors = Array.isArray(dna.colors) ? dna.colors : []
  const logoFiles = dna.logoFiles && typeof dna.logoFiles === 'object' ? dna.logoFiles : {}
  const fonts = Array.isArray(dna.loadedFonts) ? dna.loadedFonts : []
  return {
    upload:     !!(dna.isComplete || dna.primaryFont || colors.length > 0),
    typography: !!(dna.primaryFont || fonts.length > 0),
    colors:     colors.length > 0,
    layout:     !!(dna.layoutPreference),
    visual:     !!(dna.visualStyle),
    voice:      !!(dna.tone),
    logo:       Object.keys(logoFiles).length > 0,
  }
}

export default function BrandDNAPage() {
  const { activeBrand } = useBrand()
  const [activeSection, setActiveSection] = useState('typography')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dna, setDna] = useState<Record<string, any> | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const brandId = activeBrand?.id

  const loadDNA = useCallback(async () => {
    if (!brandId) { setDna(null); return }
    try {
      const res = await fetch(`/api/brand-dna?brandId=${brandId}`)
      if (res.ok) {
        const data = await res.json()
        setDna(data.dna ?? null)
      }
    } catch { /* silent */ }
  }, [brandId])

  useEffect(() => { loadDNA() }, [loadDNA, refreshKey])

  const handleSaved = useCallback(() => setRefreshKey(k => k + 1), [])

  const sectionCompletion = computeCompletion(dna)
  const completedCount = Object.values(sectionCompletion).filter(Boolean).length
  const overallPct = Math.round((completedCount / sections.length) * 100)

  return (
    <div className="max-w-[1200px]">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-neutral-900">Brand DNA</h1>
        <p className="text-sm text-neutral-500 mt-0.5">
          Your brand intelligence profile — the source of truth for every generated asset.
        </p>
      </div>

      {/* Overall progress */}
      <Card className="mb-6 bg-gradient-to-r from-indigo-50 to-violet-50 border-indigo-100">
        <CardContent className="py-4 flex items-center gap-5">
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 56 56" className="h-14 w-14 -rotate-90">
              <circle cx="28" cy="28" r="22" fill="none" stroke="#e0e7ff" strokeWidth="5" />
              <circle
                cx="28" cy="28" r="22" fill="none" stroke="#6366f1" strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - overallPct / 100)}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-indigo-700">
              {overallPct}%
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Brand DNA is {overallPct}% complete</p>
            <p className="text-xs text-neutral-500 mt-0.5">
              {completedCount} of {sections.length} sections configured · Complete all sections for best generation results
            </p>
          </div>
          <div className="ml-auto">
            {overallPct === 100 ? (
              <Button variant="success" size="sm">DNA Active</Button>
            ) : (
              <Button variant="brand" size="sm" onClick={() => {
                const next = sections.find(s => !sectionCompletion[s.id])
                if (next) setActiveSection(next.id)
              }}>
                Continue Setup
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section nav */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {sections.map((section) => {
              const done = sectionCompletion[section.id]
              const active = activeSection === section.id
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                    active ? 'bg-white shadow-sm border border-neutral-200' : 'hover:bg-white/60'
                  )}
                >
                  {done ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <Circle className={cn('h-4 w-4 shrink-0', active ? 'text-indigo-500' : 'text-neutral-300')} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium truncate', active ? 'text-neutral-900' : 'text-neutral-600')}>
                      {section.label}
                    </p>
                  </div>
                  <ChevronRight className={cn('h-3.5 w-3.5 shrink-0 transition-transform', active ? 'text-neutral-500 rotate-90' : 'text-neutral-300')} />
                </button>
              )
            })}
          </nav>
        </div>

        {/* Section content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                {(() => {
                  const s = sections.find(s => s.id === activeSection)
                  if (!s) return null
                  const Icon = s.icon
                  return (
                    <>
                      <div className="rounded-lg bg-indigo-50 p-2">
                        <Icon className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle>{s.label}</CardTitle>
                        <CardDescription className="mt-0.5">{s.description}</CardDescription>
                      </div>
                    </>
                  )
                })()}
              </div>
            </CardHeader>
            <CardContent>
              {activeSection === 'upload' && <BrandUploadZone onSaved={handleSaved} />}
              {activeSection !== 'upload' && <BrandDNAForm section={activeSection} onSaved={handleSaved} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
