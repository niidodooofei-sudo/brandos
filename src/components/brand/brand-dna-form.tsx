'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Loader2, Plus, Trash2, Upload } from 'lucide-react'
import { useBrand } from '@/contexts/brand-context'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BrandColor { id: string; name: string; hex: string }

interface LoadedFont { family: string; fileName: string; dataUrl: string; weight?: string; style?: string }

interface DNAData {
  primaryFont?: string
  secondaryFont?: string
  headingWeight?: string
  bodyWeight?: string
  typeScale?: Record<string, number>
  loadedFonts?: LoadedFont[]
  colors?: BrandColor[]
  layoutPreference?: string
  layoutImages?: Record<string, string>
  gridSystem?: { columns?: number; gutter?: number; margin?: number }
  visualStyle?: string
  shapeLanguage?: string
  imageTreatment?: { overlayOpacity?: number; filter?: string }
  tone?: string
  voiceRules?: { avoidWords?: string[]; preferredPhrases?: string[] }
  logoFiles?: Record<string, string>
  logoClearance?: string
  isComplete?: boolean
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

const INP = 'w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]'
const INP_STYLE = { background: 'var(--surface-muted)', border: '1px solid var(--border)', color: 'var(--fg)' } as const
const LBL = 'block text-xs font-medium mb-1.5'
const LBL_STYLE = { color: 'var(--fg-muted)' } as const

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

// ─── Main form ────────────────────────────────────────────────────────────────

export function BrandDNAForm({ section }: { section: string }) {
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
        if (data.dna) {
          // Rehydrate font binaries from localStorage cache
          let loadedFonts = data.dna.loadedFonts ?? []
          try {
            const cached = localStorage.getItem(`brandos:fonts:${brandId}`)
            if (cached) {
              const full = JSON.parse(cached) as LoadedFont[]
              loadedFonts = loadedFonts.map((meta: LoadedFont) => {
                const match = full.find(f => f.fileName === meta.fileName)
                return match ? { ...meta, dataUrl: match.dataUrl } : meta
              })
            }
          } catch { /* ignore */ }
          setDna({ ...data.dna, loadedFonts })
        }
      }
    } catch { /* silent */ }
    setLoading(false)
  }, [brandId])

  useEffect(() => { loadDNA() }, [loadDNA])

  const save = async (patch: Partial<DNAData>) => {
    if (!brandId) { setError('No active brand selected'); return }
    setSaving(true); setError('')
    try {
      const merged = { ...dna, ...patch }

      // Strip base64 font data before sending — store binaries in localStorage only
      const fontsForDB = (merged.loadedFonts ?? []).map(({ dataUrl: _d, ...meta }) => meta)

      // Strip large image data URLs if total payload would be too big
      const filterImages = (src: Record<string, string> | undefined) => {
        const out: Record<string, string> = {}
        for (const [k, v] of Object.entries(src ?? {})) {
          if (v && v.length < 400_000) out[k] = v
        }
        return out
      }
      const imagesForDB = filterImages(merged.layoutImages)
      const logosForDB  = filterImages(merged.logoFiles)

      // Cache full font binaries locally for this session
      if (merged.loadedFonts?.length) {
        try { localStorage.setItem(`brandos:fonts:${brandId}`, JSON.stringify(merged.loadedFonts)) } catch { /* ignore quota */ }
      }

      const payload = { brandId, ...merged, loadedFonts: fontsForDB, layoutImages: imagesForDB, logoFiles: logosForDB }

      const res = await fetch('/api/brand-dna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || `HTTP ${res.status}`)
      }
      setDna(merged)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to save. Please try again.') }
    setSaving(false)
  }

  if (!brandId) return <div className="py-8 text-center"><p className="text-sm" style={{ color: 'var(--fg-muted)' }}>Select a brand from the sidebar to edit its DNA.</p></div>
  if (loading) return <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" style={{ color: 'var(--fg-subtle)' }} /></div>

  const sp = { dna, save, saving, saved, error }

  return (
    <div className="space-y-6">
      {section === 'typography' && <TypographySection {...sp} />}
      {section === 'colors'     && <ColorsSection     {...sp} />}
      {section === 'layout'     && <LayoutSection     {...sp} />}
      {section === 'visual'     && <VisualSection     {...sp} />}
      {section === 'voice'      && <VoiceSection      {...sp} />}
      {section === 'logo'       && <LogoSection      {...sp} />}
    </div>
  )
}

type SP = { dna: DNAData; save: (p: Partial<DNAData>) => void; saving: boolean; saved: boolean; error: string }

// ─── Typography ───────────────────────────────────────────────────────────────

function TypographySection({ dna, save, saving, saved, error }: SP) {
  const [primary, setPrimary] = useState(dna.primaryFont ?? '')
  const [secondary, setSecondary] = useState(dna.secondaryFont ?? '')
  const [headW, setHeadW] = useState(dna.headingWeight ?? '700')
  const [bodyW, setBodyW] = useState(dna.bodyWeight ?? '400')
  const [scale, setScale] = useState(dna.typeScale ?? { h1: 64, h2: 48, h3: 36, h4: 28, body: 16, small: 14, caption: 12 })
  const [fonts, setFonts] = useState<LoadedFont[]>(dna.loadedFonts ?? [])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setPrimary(dna.primaryFont ?? '')
    setSecondary(dna.secondaryFont ?? '')
    setHeadW(dna.headingWeight ?? '700')
    setBodyW(dna.bodyWeight ?? '400')
    setScale(dna.typeScale ?? { h1: 64, h2: 48, h3: 36, h4: 28, body: 16, small: 14, caption: 12 })
    setFonts(dna.loadedFonts ?? [])
  }, [dna])

  // Inject @font-face for loaded fonts
  useEffect(() => {
    fonts.forEach(f => {
      const id = `bos-font-${f.family.replace(/\s/g, '-')}-${f.weight ?? '400'}`
      if (document.getElementById(id)) return
      const ext = f.fileName.split('.').pop()?.toLowerCase()
      const fmt = ext === 'woff2' ? 'woff2' : ext === 'woff' ? 'woff' : ext === 'ttf' ? 'truetype' : 'opentype'
      const style = document.createElement('style')
      style.id = id
      style.textContent = `@font-face { font-family: '${f.family}'; src: url('${f.dataUrl}') format('${fmt}'); font-weight: ${f.weight ?? 'normal'}; font-style: ${f.style ?? 'normal'}; }`
      document.head.appendChild(style)
    })
  }, [fonts])

  const handleFontUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const newFonts: LoadedFont[] = [...fonts]

    for (const file of Array.from(files)) {
      const lower = file.name.toLowerCase()
      if (['.ttf', '.woff', '.woff2', '.otf'].some(e => lower.endsWith(e))) {
        await loadFontFile(file, newFonts)
      } else if (lower.endsWith('.zip')) {
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(await file.arrayBuffer())
        for (const [name, entry] of Object.entries(zip.files)) {
          const n = name.toLowerCase()
          if (['.ttf', '.woff', '.woff2', '.otf'].some(e => n.endsWith(e)) && !entry.dir) {
            const blob = await entry.async('blob')
            const fontFile = new File([blob], name.split('/').pop() ?? name)
            await loadFontFile(fontFile, newFonts)
          }
        }
      }
    }

    setFonts(newFonts)
    setUploading(false)
  }

  const loadFontFile = (file: File, arr: LoadedFont[]): Promise<void> =>
    new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const dataUrl = e.target?.result as string
        const name = file.name.replace(/\.[^.]+$/, '')
        // Guess family name from filename
        const family = name.replace(/[-_](regular|bold|italic|light|medium|semibold|extrabold|black|thin|\d+)/gi, '').trim()
        const weight = /bold|700/i.test(name) ? '700' : /semibold|600/i.test(name) ? '600' : /medium|500/i.test(name) ? '500' : /light|300/i.test(name) ? '300' : '400'
        const style = /italic/i.test(name) ? 'italic' : 'normal'
        arr.push({ family, fileName: file.name, dataUrl, weight, style })
        resolve()
      }
      reader.readAsDataURL(file)
    })

  const removeFont = (idx: number) => setFonts(f => f.filter((_, i) => i !== idx))

  const previewFont = primary || (fonts[0]?.family ?? '')

  return (
    <div className="space-y-6">
      {/* Font upload */}
      <div>
        <p className="text-sm font-semibold mb-2" style={{ color: 'var(--fg)' }}>Font Files</p>
        <p className="text-xs mb-3" style={{ color: 'var(--fg-muted)' }}>Upload .ttf, .woff, .woff2, .otf files or a .zip containing them</p>
        <div
          className="flex items-center justify-center gap-3 rounded-xl border-2 border-dashed p-5 cursor-pointer transition-colors"
          style={{ borderColor: 'var(--border)' }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-light)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          onClick={() => fileRef.current?.click()}
        >
          <input ref={fileRef} type="file" accept=".ttf,.woff,.woff2,.otf,.zip" multiple className="sr-only" onChange={e => handleFontUpload(e.target.files)} />
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" style={{ color: 'var(--brand)' }} /> : <Upload className="h-4 w-4" style={{ color: 'var(--brand)' }} />}
          <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>{uploading ? 'Processing fonts…' : 'Click or drag font files / ZIP'}</span>
        </div>

        {fonts.length > 0 && (
          <div className="mt-3 space-y-2">
            {fonts.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--fg)', fontFamily: f.family }}>{f.family}</p>
                  <p className="text-xs truncate" style={{ color: 'var(--fg-subtle)' }}>{f.fileName} · w{f.weight} · {f.style}</p>
                </div>
                <button onClick={() => removeFont(i)} className="shrink-0 p-1 rounded" style={{ color: 'var(--fg-subtle)' }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Font names */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LBL} style={LBL_STYLE}>Primary Font Name</label>
          <input className={INP} style={INP_STYLE} placeholder="e.g. Inter" value={primary} onChange={e => setPrimary(e.target.value)} list="loaded-fonts" />
          <datalist id="loaded-fonts">{fonts.map(f => <option key={f.family} value={f.family} />)}</datalist>
        </div>
        <div>
          <label className={LBL} style={LBL_STYLE}>Secondary Font Name</label>
          <input className={INP} style={INP_STYLE} placeholder="e.g. Georgia" value={secondary} onChange={e => setSecondary(e.target.value)} list="loaded-fonts" />
        </div>
        <div>
          <label className={LBL} style={LBL_STYLE}>Heading Weight</label>
          <select className={INP + ' appearance-none'} style={INP_STYLE} value={headW} onChange={e => setHeadW(e.target.value)}>
            {[['400','Regular'],['500','Medium'],['600','Semibold'],['700','Bold'],['800','Extrabold'],['900','Black']].map(([v,l]) => <option key={v} value={v}>{l} ({v})</option>)}
          </select>
        </div>
        <div>
          <label className={LBL} style={LBL_STYLE}>Body Weight</label>
          <select className={INP + ' appearance-none'} style={INP_STYLE} value={bodyW} onChange={e => setBodyW(e.target.value)}>
            {[['300','Light'],['400','Regular'],['500','Medium']].map(([v,l]) => <option key={v} value={v}>{l} ({v})</option>)}
          </select>
        </div>
      </div>

      {/* Type scale */}
      <div>
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Type Scale (px)</p>
        <div className="grid grid-cols-4 gap-3">
          {(['h1','h2','h3','h4','body','small','caption'] as const).map(k => (
            <div key={k}>
              <label className="text-xs mb-1 block capitalize" style={{ color: 'var(--fg-subtle)' }}>{k}</label>
              <input type="number" className="w-full rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]" style={INP_STYLE}
                value={scale[k] ?? ''} onChange={e => setScale(p => ({ ...p, [k]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      {previewFont && (
        <div>
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--fg)' }}>Preview</p>
          <div className="rounded-xl p-6 space-y-2" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
            <p style={{ fontFamily: previewFont, fontSize: 36, fontWeight: Number(headW), color: 'var(--fg)', lineHeight: 1.2 }}>The Quick Brown Fox</p>
            <p style={{ fontFamily: secondary || previewFont, fontSize: 16, fontWeight: Number(bodyW), color: 'var(--fg-muted)' }}>Pack my box with five dozen liquor jugs.</p>
          </div>
        </div>
      )}

      <SaveBar onSave={() => save({ primaryFont: primary, secondaryFont: secondary, headingWeight: headW, bodyWeight: bodyW, typeScale: scale, loadedFonts: fonts })} saving={saving} saved={saved} error={error} />
    </div>
  )
}

// ─── Colors ───────────────────────────────────────────────────────────────────

function ColorRow({ color, onChange, onRemove }: { color: BrandColor; onChange: (c: BrandColor) => void; onRemove: () => void }) {
  const [hexText, setHexText] = useState(color.hex)

  useEffect(() => { setHexText(color.hex) }, [color.hex])

  const applyHex = (val: string) => {
    setHexText(val)
    if (/^#[0-9a-fA-F]{6}$/.test(val)) onChange({ ...color, hex: val })
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-3" style={{ border: '1px solid var(--border)', background: 'var(--surface-muted)' }}>
      {/* Color picker */}
      <div className="relative shrink-0">
        <input
          type="color"
          value={color.hex}
          onChange={e => { onChange({ ...color, hex: e.target.value }); setHexText(e.target.value) }}
          className="h-11 w-11 rounded-lg cursor-pointer p-0.5"
          style={{ border: '1px solid var(--border)' }}
        />
      </div>

      {/* Hex text input */}
      <input
        type="text"
        value={hexText}
        onChange={e => applyHex(e.target.value.startsWith('#') ? e.target.value : '#' + e.target.value)}
        onBlur={() => { if (!/^#[0-9a-fA-F]{6}$/.test(hexText)) setHexText(color.hex) }}
        className="w-28 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        placeholder="#000000"
        maxLength={7}
      />

      {/* Color name */}
      <input
        type="text"
        value={color.name}
        onChange={e => onChange({ ...color, name: e.target.value })}
        className="flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)]"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--fg)' }}
        placeholder="Color name (e.g. Ocean Blue)"
      />

      <button onClick={onRemove} className="shrink-0 p-1.5 rounded-lg transition-colors" style={{ color: 'var(--fg-subtle)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e'; (e.currentTarget as HTMLButtonElement).style.background = '#fff1f2' }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-subtle)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}>
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

const DEFAULT_COLORS: BrandColor[] = [
  { id: '1', name: 'Primary', hex: '#1a1a2e' },
  { id: '2', name: 'Secondary', hex: '#16213e' },
  { id: '3', name: 'Accent', hex: '#e94560' },
  { id: '4', name: 'Background', hex: '#ffffff' },
  { id: '5', name: 'Text', hex: '#1a1a2e' },
]

function ColorsSection({ dna, save, saving, saved, error }: SP) {
  const rawColors = dna.colors
  const [colors, setColors] = useState<BrandColor[]>(
    Array.isArray(rawColors) && rawColors.length > 0 ? rawColors : DEFAULT_COLORS
  )

  useEffect(() => {
    if (Array.isArray(dna.colors) && dna.colors.length > 0) setColors(dna.colors)
  }, [dna.colors])

  const addColor = () => setColors(p => [...p, { id: Date.now().toString(), name: 'New Color', hex: '#7c3aed' }])

  const update = (id: string, c: BrandColor) => setColors(p => p.map(x => x.id === id ? c : x))
  const remove = (id: string) => setColors(p => p.filter(x => x.id !== id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>Brand Colors ({colors.length})</p>
        <button onClick={addColor} className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--brand)', background: 'var(--brand-bg)' }}>
          <Plus className="h-3.5 w-3.5" /> Add Color
        </button>
      </div>

      <div className="space-y-2">
        {colors.map(c => (
          <ColorRow key={c.id} color={c} onChange={u => update(c.id, u)} onRemove={() => remove(c.id)} />
        ))}
      </div>

      {/* Swatch strip */}
      {colors.length > 0 && (
        <div className="flex gap-1.5 flex-wrap pt-1">
          {colors.map(c => (
            <div key={c.id} className="flex flex-col items-center gap-1">
              <div className="h-9 w-9 rounded-lg" style={{ backgroundColor: c.hex, border: '1px solid var(--border)' }} title={c.hex} />
              <p className="text-[9px] text-center max-w-[36px] truncate" style={{ color: 'var(--fg-subtle)' }}>{c.name}</p>
            </div>
          ))}
        </div>
      )}

      <SaveBar onSave={() => save({ colors })} saving={saving} saved={saved} error={error} />
    </div>
  )
}

// ─── Layout ───────────────────────────────────────────────────────────────────

function LayoutSection({ dna, save, saving, saved, error }: SP) {
  const [layout, setLayout] = useState(dna.layoutPreference ?? 'minimalist')
  const [grid, setGrid] = useState(dna.gridSystem ?? { columns: 12, gutter: 24, margin: 40 })
  const [images, setImages] = useState<Record<string, string>>(dna.layoutImages ?? {})

  useEffect(() => { if (dna.layoutPreference) setLayout(dna.layoutPreference) }, [dna.layoutPreference])
  useEffect(() => { if (dna.gridSystem) setGrid(dna.gridSystem) }, [dna.gridSystem])
  useEffect(() => { if (dna.layoutImages) setImages(dna.layoutImages) }, [dna.layoutImages])

  const handleImageUpload = (key: string, file: File) => {
    const reader = new FileReader()
    reader.onload = e => setImages(p => ({ ...p, [key]: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const LAYOUTS = [
    ['minimalist','Minimalist','Clean, whitespace-heavy'],
    ['editorial','Editorial','Magazine-style layouts'],
    ['corporate','Corporate','Structured, professional'],
    ['bold','Bold','High contrast, impact'],
    ['luxury','Luxury','Premium, refined'],
  ]

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>Layout Preference</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {LAYOUTS.map(([v, l, d]) => (
            <button key={v} onClick={() => setLayout(v)} className="text-left rounded-xl p-3 transition-all"
              style={{ border: `2px solid ${layout === v ? 'var(--brand)' : 'var(--border)'}`, background: layout === v ? 'var(--brand-bg)' : 'transparent' }}>
              <p className="text-sm font-medium" style={{ color: layout === v ? 'var(--brand)' : 'var(--fg)' }}>{l}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{d}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Layout reference images */}
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>Layout Reference Images</p>
        <p className="text-xs mb-3" style={{ color: 'var(--fg-muted)' }}>Upload PNG examples of your preferred layout style — used as reference for generation</p>
        <div className="grid grid-cols-2 gap-3">
          {['hero', 'editorial', 'product', 'social'].map(key => (
            <label key={key} className="cursor-pointer">
              <p className="text-xs font-medium mb-1 capitalize" style={{ color: 'var(--fg-muted)' }}>{key} layout</p>
              <div className="relative rounded-xl overflow-hidden transition-colors" style={{ border: '2px dashed var(--border)', minHeight: 100 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-light)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => e.target.files?.[0] && handleImageUpload(key, e.target.files[0])} />
                {images[key] ? (
                  <>
                    <img src={images[key]} alt={key} className="w-full h-full object-cover" style={{ maxHeight: 140 }} />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <p className="text-white text-xs font-medium">Replace</p>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1.5 h-24">
                    <Plus className="h-5 w-5" style={{ color: 'var(--fg-subtle)' }} />
                    <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>Upload PNG</p>
                  </div>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>Grid System</p>
        <div className="grid grid-cols-3 gap-4">
          {([['columns','Columns',12],['gutter','Gutter (px)',24],['margin','Margin (px)',40]] as const).map(([k,l,def]) => (
            <div key={k}>
              <label className={LBL} style={LBL_STYLE}>{l}</label>
              <input type="number" className={INP} style={INP_STYLE} value={grid[k] ?? def} onChange={e => setGrid(p => ({ ...p, [k]: Number(e.target.value) }))} />
            </div>
          ))}
        </div>
      </div>

      <SaveBar onSave={() => save({ layoutPreference: layout, gridSystem: grid, layoutImages: images })} saving={saving} saved={saved} error={error} />
    </div>
  )
}

// ─── Visual ───────────────────────────────────────────────────────────────────

function VisualSection({ dna, save, saving, saved, error }: SP) {
  const [visual, setVisual] = useState(dna.visualStyle ?? 'photography')
  const [shape, setShape] = useState(dna.shapeLanguage ?? 'geometric')
  const [treatment, setTreatment] = useState(dna.imageTreatment ?? { overlayOpacity: 0.4, filter: 'none' })

  useEffect(() => { if (dna.visualStyle) setVisual(dna.visualStyle) }, [dna.visualStyle])
  useEffect(() => { if (dna.shapeLanguage) setShape(dna.shapeLanguage) }, [dna.shapeLanguage])
  useEffect(() => { if (dna.imageTreatment) setTreatment(dna.imageTreatment) }, [dna.imageTreatment])

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>Visual Style</p>
        <div className="grid grid-cols-2 gap-3">
          {[['photography','Photography','Real photos as hero elements'],['illustration','Illustration','Custom illustrations & graphics'],['abstract','Abstract','Shapes, gradients, geometric'],['mixed','Mixed','Combination of styles']].map(([v,l,d]) => (
            <button key={v} onClick={() => setVisual(v)} className="text-left rounded-xl p-4 transition-all"
              style={{ border: `2px solid ${visual === v ? 'var(--brand)' : 'var(--border)'}`, background: visual === v ? 'var(--brand-bg)' : 'transparent' }}>
              <p className="text-sm font-medium" style={{ color: visual === v ? 'var(--brand)' : 'var(--fg)' }}>{l}</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>{d}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>Shape Language</p>
        <div className="flex gap-3">
          {[['geometric','Geometric'],['organic','Organic'],['minimal','Minimal'],['bold','Bold']].map(([v,l]) => (
            <button key={v} onClick={() => setShape(v)} className="flex-1 rounded-xl py-3 px-2 text-center transition-all"
              style={{ border: `2px solid ${shape === v ? 'var(--brand)' : 'var(--border)'}`, background: shape === v ? 'var(--brand-bg)' : 'transparent' }}>
              <p className="text-xs font-medium" style={{ color: shape === v ? 'var(--brand)' : 'var(--fg)' }}>{l}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>Image Treatment</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={LBL} style={LBL_STYLE}>Overlay Opacity: {treatment.overlayOpacity}</label>
            <input type="range" min={0} max={1} step={0.05} value={treatment.overlayOpacity ?? 0.4}
              onChange={e => setTreatment(p => ({ ...p, overlayOpacity: Number(e.target.value) }))} className="w-full" />
          </div>
          <div>
            <label className={LBL} style={LBL_STYLE}>Color Filter</label>
            <select className={INP + ' appearance-none'} style={INP_STYLE} value={treatment.filter ?? 'none'}
              onChange={e => setTreatment(p => ({ ...p, filter: e.target.value }))}>
              {[['none','None'],['warm','Warm'],['cool','Cool'],['bw','Black & White']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
      </div>

      <SaveBar onSave={() => save({ visualStyle: visual, shapeLanguage: shape, imageTreatment: treatment })} saving={saving} saved={saved} error={error} />
    </div>
  )
}

// ─── Voice ────────────────────────────────────────────────────────────────────

function VoiceSection({ dna, save, saving, saved, error }: SP) {
  const [tone, setTone] = useState(dna.tone ?? 'professional')
  const [avoid, setAvoid] = useState((dna.voiceRules?.avoidWords ?? []).join('\n'))
  const [preferred, setPreferred] = useState((dna.voiceRules?.preferredPhrases ?? []).join('\n'))

  useEffect(() => {
    if (dna.tone) setTone(dna.tone)
    if (dna.voiceRules?.avoidWords) setAvoid(dna.voiceRules.avoidWords.join('\n'))
    if (dna.voiceRules?.preferredPhrases) setPreferred(dna.voiceRules.preferredPhrases.join('\n'))
  }, [dna])

  const TA = 'w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none'

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold mb-3" style={{ color: 'var(--fg)' }}>Brand Tone</p>
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
        <label className={LBL} style={LBL_STYLE}>Words to Avoid <span style={{ color: 'var(--fg-subtle)', fontWeight: 400 }}>(one per line)</span></label>
        <textarea rows={3} className={TA} style={INP_STYLE} placeholder={'cheap\ndiscount\nfree'} value={avoid} onChange={e => setAvoid(e.target.value)} />
      </div>

      <div>
        <label className={LBL} style={LBL_STYLE}>Preferred Phrases <span style={{ color: 'var(--fg-subtle)', fontWeight: 400 }}>(one per line)</span></label>
        <textarea rows={3} className={TA} style={INP_STYLE} placeholder={'Crafted with care\nBuilt to last'} value={preferred} onChange={e => setPreferred(e.target.value)} />
      </div>

      <SaveBar
        onSave={() => save({ tone, voiceRules: { avoidWords: avoid.split('\n').map(s => s.trim()).filter(Boolean), preferredPhrases: preferred.split('\n').map(s => s.trim()).filter(Boolean) } })}
        saving={saving} saved={saved} error={error}
      />
    </div>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

const LOGO_SLOTS = [
  { key: 'primary',  label: 'Primary Logo',  desc: 'Full color · light background',   bg: '#ffffff' },
  { key: 'reversed', label: 'Reversed Logo',  desc: 'Light version · dark background', bg: '#1a1a2e' },
  { key: 'icon',     label: 'Icon / Mark',    desc: 'Symbol only, no wordmark',        bg: '#f5f5f7' },
  { key: 'wordmark', label: 'Wordmark',       desc: 'Text-only logo',                  bg: '#ffffff' },
]

function LogoSection({ dna, save, saving, saved, error }: SP) {
  const [logos, setLogos] = useState<Record<string, string>>(
    dna.logoFiles && typeof dna.logoFiles === 'object' ? (dna.logoFiles as Record<string, string>) : {}
  )
  const [clearance, setClearance] = useState(
    typeof dna.logoClearance === 'string' ? dna.logoClearance : ''
  )

  useEffect(() => {
    setLogos(dna.logoFiles && typeof dna.logoFiles === 'object' ? (dna.logoFiles as Record<string, string>) : {})
    setClearance(typeof dna.logoClearance === 'string' ? dna.logoClearance : '')
  }, [dna.logoFiles, dna.logoClearance])

  const handleFile = (key: string, file: File) => {
    const reader = new FileReader()
    reader.onload = e => setLogos(p => ({ ...p, [key]: e.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const removeLogo = (key: string) => setLogos(p => { const n = { ...p }; delete n[key]; return n })

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--fg)' }}>Logo Files</p>
        <p className="text-xs mb-4" style={{ color: 'var(--fg-muted)' }}>Upload SVG, PNG, or WebP. Each slot shows a preview on the correct background color.</p>

        <div className="grid grid-cols-2 gap-4">
          {LOGO_SLOTS.map(({ key, label, desc, bg }) => {
            const isDark = bg === '#1a1a2e'
            const placeholderColor = isDark ? 'rgba(255,255,255,0.35)' : 'var(--fg-subtle)'
            const borderColor = isDark ? 'rgba(255,255,255,0.15)' : 'var(--border)'
            return (
              <div key={key}>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--fg-muted)' }}>{label}</p>
                <label className="cursor-pointer block">
                  <div
                    className="relative rounded-xl overflow-hidden transition-all"
                    style={{ border: `2px dashed ${borderColor}`, minHeight: 120, background: bg }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = isDark ? 'rgba(124,58,237,0.6)' : 'var(--brand-light)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = borderColor)}
                  >
                    <input
                      type="file"
                      accept="image/*,.svg"
                      className="sr-only"
                      onChange={e => e.target.files?.[0] && handleFile(key, e.target.files[0])}
                    />
                    {logos[key] ? (
                      <>
                        <img
                          src={logos[key]}
                          alt={label}
                          className="w-full object-contain p-4"
                          style={{ maxHeight: 120 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(0,0,0,0.4)' }}>
                          <p className="text-white text-xs font-semibold">Replace</p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 h-28">
                        <div className="h-9 w-9 rounded-xl border-2 border-dashed flex items-center justify-center"
                          style={{ borderColor }}>
                          <Plus className="h-4 w-4" style={{ color: placeholderColor }} />
                        </div>
                        <p className="text-xs text-center px-3" style={{ color: placeholderColor }}>{desc}</p>
                      </div>
                    )}
                  </div>
                </label>
                {logos[key] && (
                  <button
                    className="mt-1 text-xs"
                    style={{ color: '#f43f5e' }}
                    onClick={() => removeLogo(key)}
                  >
                    Remove
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <label className={LBL} style={LBL_STYLE}>
          Logo Usage Rules & Clearance
        </label>
        <textarea
          rows={3}
          className="w-full rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand)] resize-none"
          style={INP_STYLE}
          placeholder="e.g. Maintain minimum clearance of 2× the logo height. Never rotate, skew, or place on busy backgrounds."
          value={clearance}
          onChange={e => setClearance(e.target.value)}
        />
      </div>

      <SaveBar
        onSave={() => save({ logoFiles: logos, logoClearance: clearance })}
        saving={saving}
        saved={saved}
        error={error}
      />
    </div>
  )
}
