'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useBrand } from '@/contexts/brand-context'

interface DNAData {
  primaryFont?: string
  secondaryFont?: string
  headingWeight?: string
  bodyWeight?: string
  typeScale?: Record<string, number>
  colors?: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string }
  layoutPreference?: string
  gridSystem?: { columns?: number; gutter?: number; margin?: number }
  visualStyle?: string
  shapeLanguage?: string
  imageTreatment?: { overlayOpacity?: number; filter?: string }
  tone?: string
  voiceRules?: { avoidWords?: string[]; preferredPhrases?: string[] }
  isComplete?: boolean
}

interface BrandDNAFormProps {
  section: string
}

export function BrandDNAForm({ section }: BrandDNAFormProps) {
  const { activeBrand } = useBrand()
  const [dna, setDna] = useState<DNAData>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  const brandId = activeBrand?.id

  const loadDNA = useCallback(async () => {
    if (!brandId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/brand-dna?brandId=${brandId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.dna) setDna(data.dna)
      }
    } catch { /* ignore */ }
    setLoading(false)
  }, [brandId])

  useEffect(() => { loadDNA() }, [loadDNA])

  const handleSave = async (sectionData: Partial<DNAData>) => {
    if (!brandId) { setError('No active brand selected'); return }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/brand-dna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, ...dna, ...sectionData }),
      })
      if (!res.ok) throw new Error('Save failed')
      setDna(prev => ({ ...prev, ...sectionData }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch {
      setError('Failed to save. Please try again.')
    }
    setSaving(false)
  }

  if (!brandId) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>Select a brand from the sidebar to edit its DNA.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-8 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--fg-subtle)' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {section === 'typography' && <TypographySection dna={dna} onChange={handleSave} saving={saving} saved={saved} error={error} />}
      {section === 'colors' && <ColorsSection dna={dna} onChange={handleSave} saving={saving} saved={saved} error={error} />}
      {section === 'layout' && <LayoutSection dna={dna} onChange={handleSave} saving={saving} saved={saved} error={error} />}
      {section === 'visual' && <VisualSection dna={dna} onChange={handleSave} saving={saving} saved={saved} error={error} />}
      {section === 'voice' && <VoiceSection dna={dna} onChange={handleSave} saving={saving} saved={saved} error={error} />}
      {section === 'logo' && <LogoSection />}
    </div>
  )
}

interface SectionProps {
  dna: DNAData
  onChange: (data: Partial<DNAData>) => void
  saving: boolean
  saved: boolean
  error: string
}

function SaveBar({ onSave, saving, saved, error }: { onSave: () => void; saving: boolean; saved: boolean; error: string }) {
  return (
    <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
      <Button variant="brand" onClick={onSave} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCircle2 className="h-4 w-4" /> : null}
        {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Section'}
      </Button>
      {error && <p className="text-sm" style={{ color: '#f43f5e' }}>{error}</p>}
    </div>
  )
}

function TypographySection({ dna, onChange, saving, saved, error }: SectionProps) {
  const [local, setLocal] = useState({
    primaryFont: dna.primaryFont ?? '',
    secondaryFont: dna.secondaryFont ?? '',
    headingWeight: dna.headingWeight ?? '700',
    bodyWeight: dna.bodyWeight ?? '400',
    typeScale: dna.typeScale ?? { h1: 64, h2: 48, h3: 36, h4: 28, body: 16, small: 14, caption: 12 },
  })

  useEffect(() => {
    setLocal({
      primaryFont: dna.primaryFont ?? '',
      secondaryFont: dna.secondaryFont ?? '',
      headingWeight: dna.headingWeight ?? '700',
      bodyWeight: dna.bodyWeight ?? '400',
      typeScale: dna.typeScale ?? { h1: 64, h2: 48, h3: 36, h4: 28, body: 16, small: 14, caption: 12 },
    })
  }, [dna])

  const inp = 'w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const inpStyle = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }
  const label = 'block text-xs font-medium mb-1.5'
  const labelStyle = { color: 'var(--fg-muted)' }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label} style={labelStyle}>Primary Font</label>
          <input className={inp} style={inpStyle} placeholder="e.g. Inter, Neue Haas Grotesk" value={local.primaryFont} onChange={e => setLocal(p => ({ ...p, primaryFont: e.target.value }))} />
        </div>
        <div>
          <label className={label} style={labelStyle}>Secondary Font</label>
          <input className={inp} style={inpStyle} placeholder="e.g. Georgia, Playfair Display" value={local.secondaryFont} onChange={e => setLocal(p => ({ ...p, secondaryFont: e.target.value }))} />
        </div>
        <div>
          <label className={label} style={labelStyle}>Heading Weight</label>
          <select className={inp + ' appearance-none'} style={inpStyle} value={local.headingWeight} onChange={e => setLocal(p => ({ ...p, headingWeight: e.target.value }))}>
            {[['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Extrabold'],['900','Black']].map(([v,l]) => <option key={v} value={v}>{l} ({v})</option>)}
          </select>
        </div>
        <div>
          <label className={label} style={labelStyle}>Body Weight</label>
          <select className={inp + ' appearance-none'} style={inpStyle} value={local.bodyWeight} onChange={e => setLocal(p => ({ ...p, bodyWeight: e.target.value }))}>
            {[['300','Light'],['400','Regular'],['500','Medium']].map(([v,l]) => <option key={v} value={v}>{l} ({v})</option>)}
          </select>
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Type Scale (px)</p>
        <div className="grid grid-cols-4 gap-3">
          {(['h1','h2','h3','h4','body','small','caption'] as const).map(k => (
            <div key={k}>
              <label className="text-xs mb-1 block capitalize" style={{ color: 'var(--fg-subtle)' }}>{k}</label>
              <input type="number" className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" style={inpStyle}
                value={local.typeScale[k] ?? ''} onChange={e => setLocal(p => ({ ...p, typeScale: { ...p.typeScale, [k]: Number(e.target.value) } }))} />
            </div>
          ))}
        </div>
      </div>

      {local.primaryFont && (
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Font Preview</p>
          <div className="rounded-xl p-6 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p style={{ fontFamily: local.primaryFont, fontSize: 36, fontWeight: Number(local.headingWeight), color: 'var(--fg)', lineHeight: 1.2 }}>The Quick Brown Fox</p>
            <p style={{ fontFamily: local.secondaryFont || local.primaryFont, fontSize: 16, color: 'var(--fg-muted)' }}>Pack my box with five dozen liquor jugs.</p>
          </div>
        </div>
      )}

      <SaveBar onSave={() => onChange(local)} saving={saving} saved={saved} error={error} />
    </div>
  )
}

function ColorsSection({ dna, onChange, saving, saved, error }: SectionProps) {
  const [colors, setColors] = useState(dna.colors ?? { primary: '#1a1a2e', secondary: '#16213e', accent: '#e94560', background: '#ffffff', text: '#1a1a2e' })

  useEffect(() => { if (dna.colors) setColors(dna.colors) }, [dna.colors])

  const fields = [
    { key: 'primary' as const, label: 'Primary', desc: 'Main brand color — CTAs, headings' },
    { key: 'secondary' as const, label: 'Secondary', desc: 'Supporting brand color' },
    { key: 'accent' as const, label: 'Accent', desc: 'Highlight color — promotions, badges' },
    { key: 'background' as const, label: 'Background', desc: 'Default canvas background' },
    { key: 'text' as const, label: 'Text', desc: 'Primary body text color' },
  ]

  return (
    <div className="space-y-4">
      {fields.map(f => (
        <div key={f.key} className="flex items-center gap-4 rounded-xl p-4" style={{ border: '1px solid var(--border)' }}>
          <input type="color" value={colors[f.key] ?? '#000000'} onChange={e => setColors(p => ({ ...p, [f.key]: e.target.value }))}
            className="h-12 w-12 rounded-lg cursor-pointer p-0.5" style={{ border: '1px solid var(--border)' }} />
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{f.label}</p>
            <p className="text-xs" style={{ color: 'var(--fg-muted)' }}>{f.desc}</p>
          </div>
          <input type="text" value={colors[f.key] ?? ''} onChange={e => setColors(p => ({ ...p, [f.key]: e.target.value }))}
            className="w-28 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
            style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }} />
        </div>
      ))}

      <div className="rounded-xl p-4" style={{ border: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
        <p className="text-xs font-medium mb-3" style={{ color: 'var(--fg-muted)' }}>Color Preview</p>
        <div className="flex gap-2">
          {Object.entries(colors).map(([key, hex]) => (
            <div key={key} className="flex-1 text-center">
              <div className="h-10 rounded-lg mb-1" style={{ backgroundColor: hex as string, border: '1px solid var(--border)' }} />
              <p className="text-[10px] capitalize" style={{ color: 'var(--fg-subtle)' }}>{key}</p>
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={() => onChange({ colors })} saving={saving} saved={saved} error={error} />
    </div>
  )
}

function LayoutSection({ dna, onChange, saving, saved, error }: SectionProps) {
  const [layout, setLayout] = useState(dna.layoutPreference ?? 'minimalist')
  const [grid, setGrid] = useState(dna.gridSystem ?? { columns: 12, gutter: 24, margin: 40 })

  useEffect(() => { if (dna.layoutPreference) setLayout(dna.layoutPreference) }, [dna.layoutPreference])
  useEffect(() => { if (dna.gridSystem) setGrid(dna.gridSystem) }, [dna.gridSystem])

  const inp = 'w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
  const inpStyle = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Layout Preference</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[['minimalist','Minimalist','Clean, whitespace-heavy'],['editorial','Editorial','Magazine-style layouts'],['corporate','Corporate','Structured, professional'],['bold','Bold','High contrast, impact'],['luxury','Luxury','Premium, refined']].map(([v,l,d]) => (
            <button key={v} onClick={() => setLayout(v)}
              className="text-left rounded-xl p-3 transition-all"
              style={{ border: `2px solid ${layout === v ? 'var(--brand)' : 'var(--border)'}`, background: layout === v ? 'var(--brand-bg)' : 'transparent' }}>
              <p className="text-sm font-medium" style={{ color: layout === v ? 'var(--brand)' : 'var(--fg)' }}>{l}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{d}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {([['columns','Columns',12],['gutter','Gutter (px)',24],['margin','Margin (px)',40]] as const).map(([k,l,def]) => (
          <div key={k}>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>{l}</label>
            <input type="number" className={inp} style={inpStyle} value={grid[k] ?? def} onChange={e => setGrid(p => ({ ...p, [k]: Number(e.target.value) }))} />
          </div>
        ))}
      </div>

      <SaveBar onSave={() => onChange({ layoutPreference: layout, gridSystem: grid })} saving={saving} saved={saved} error={error} />
    </div>
  )
}

function VisualSection({ dna, onChange, saving, saved, error }: SectionProps) {
  const [visual, setVisual] = useState(dna.visualStyle ?? 'photography')
  const [shape, setShape] = useState(dna.shapeLanguage ?? 'geometric')
  const [treatment, setTreatment] = useState(dna.imageTreatment ?? { overlayOpacity: 0.4, filter: 'none' })

  useEffect(() => { if (dna.visualStyle) setVisual(dna.visualStyle) }, [dna.visualStyle])
  useEffect(() => { if (dna.shapeLanguage) setShape(dna.shapeLanguage) }, [dna.shapeLanguage])
  useEffect(() => { if (dna.imageTreatment) setTreatment(dna.imageTreatment) }, [dna.imageTreatment])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Visual Style</p>
        <div className="grid grid-cols-2 gap-3">
          {[['photography','Photography Driven','Real photos as hero elements'],['illustration','Illustration Driven','Custom illustrations & graphics'],['abstract','Abstract','Shapes, gradients, geometric'],['mixed','Mixed','Combination of styles']].map(([v,l,d]) => (
            <button key={v} onClick={() => setVisual(v)} className="text-left rounded-xl p-4 transition-all"
              style={{ border: `2px solid ${visual === v ? 'var(--brand)' : 'var(--border)'}`, background: visual === v ? 'var(--brand-bg)' : 'transparent' }}>
              <p className="text-sm font-medium" style={{ color: visual === v ? 'var(--brand)' : 'var(--fg)' }}>{l}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{d}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Shape Language</p>
        <div className="flex gap-3">
          {[['geometric','Geometric'],['organic','Organic'],['minimal','Minimal'],['bold','Bold']].map(([v,l]) => (
            <button key={v} onClick={() => setShape(v)} className="flex-1 rounded-xl p-3 text-center transition-all"
              style={{ border: `2px solid ${shape === v ? 'var(--brand)' : 'var(--border)'}`, background: shape === v ? 'var(--brand-bg)' : 'transparent' }}>
              <p className="text-xs font-medium" style={{ color: shape === v ? 'var(--brand)' : 'var(--fg)' }}>{l}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>Image Treatment</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--fg-muted)' }}>Overlay Opacity: {treatment.overlayOpacity}</label>
            <input type="range" min={0} max={1} step={0.05} value={treatment.overlayOpacity ?? 0.4}
              onChange={e => setTreatment(p => ({ ...p, overlayOpacity: Number(e.target.value) }))} className="w-full" />
          </div>
          <div>
            <label className="text-xs mb-1 block" style={{ color: 'var(--fg-muted)' }}>Color Filter</label>
            <select className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] appearance-none"
              style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }}
              value={treatment.filter ?? 'none'} onChange={e => setTreatment(p => ({ ...p, filter: e.target.value }))}>
              {[['none','None'],['warm','Warm'],['cool','Cool'],['bw','Black & White']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <SaveBar onSave={() => onChange({ visualStyle: visual, shapeLanguage: shape, imageTreatment: treatment })} saving={saving} saved={saved} error={error} />
    </div>
  )
}

function VoiceSection({ dna, onChange, saving, saved, error }: SectionProps) {
  const [tone, setTone] = useState(dna.tone ?? 'professional')
  const [avoidWords, setAvoidWords] = useState((dna.voiceRules?.avoidWords ?? []).join('\n'))
  const [preferredPhrases, setPreferredPhrases] = useState((dna.voiceRules?.preferredPhrases ?? []).join('\n'))

  useEffect(() => {
    if (dna.tone) setTone(dna.tone)
    if (dna.voiceRules?.avoidWords) setAvoidWords(dna.voiceRules.avoidWords.join('\n'))
    if (dna.voiceRules?.preferredPhrases) setPreferredPhrases(dna.voiceRules.preferredPhrases.join('\n'))
  }, [dna])

  const ta = 'w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none'
  const taStyle = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Brand Tone</p>
        <div className="grid grid-cols-2 gap-3">
          {[['professional','Professional','Authoritative, trustworthy, clear'],['friendly','Friendly','Warm, approachable, conversational'],['premium','Premium','Refined, aspirational, exclusive'],['technical','Technical','Precise, data-driven, expert'],['playful','Playful','Fun, energetic, bold']].map(([v,l,d]) => (
            <button key={v} onClick={() => setTone(v)} className="text-left rounded-xl p-4 transition-all"
              style={{ border: `2px solid ${tone === v ? 'var(--brand)' : 'var(--border)'}`, background: tone === v ? 'var(--brand-bg)' : 'transparent' }}>
              <p className="text-sm font-medium" style={{ color: tone === v ? 'var(--brand)' : 'var(--fg)' }}>{l}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{d}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>Words to Avoid <span style={{ color: 'var(--fg-subtle)' }}>(one per line)</span></label>
        <textarea rows={3} className={ta} style={taStyle} placeholder="e.g. cheap&#10;discount&#10;free"
          value={avoidWords} onChange={e => setAvoidWords(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>Preferred Phrases <span style={{ color: 'var(--fg-subtle)' }}>(one per line)</span></label>
        <textarea rows={3} className={ta} style={taStyle} placeholder="e.g. Crafted with care&#10;Built to last"
          value={preferredPhrases} onChange={e => setPreferredPhrases(e.target.value)} />
      </div>

      <SaveBar
        onSave={() => onChange({
          tone,
          voiceRules: {
            avoidWords: avoidWords.split('\n').map(s => s.trim()).filter(Boolean),
            preferredPhrases: preferredPhrases.split('\n').map(s => s.trim()).filter(Boolean),
          },
        })}
        saving={saving} saved={saved} error={error}
      />
    </div>
  )
}

function LogoSection() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        {[['Primary Logo','Full color on light backgrounds'],['Reversed Logo','White/light on dark backgrounds'],['Icon / Mark','Symbol only, no wordmark'],['Wordmark','Text-only logo']].map(([l,d]) => (
          <label key={l} className="cursor-pointer">
            <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>{l}</p>
            <div className="flex flex-col items-center justify-center gap-2 h-24 rounded-xl border-2 border-dashed transition-colors"
              style={{ borderColor: 'var(--border)' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-light)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
              <input type="file" accept="image/*,.svg" className="sr-only" />
              <div className="text-2xl" style={{ color: 'var(--fg-subtle)' }}>+</div>
              <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>{d}</p>
            </div>
          </label>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>Logo file storage coming soon — use the PDF upload to extract logo rules from your brand guidelines.</p>
    </div>
  )
}
