'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useBrand } from '@/contexts/brand-context'

type ParseStage = 'idle' | 'uploading' | 'extracting' | 'reviewing' | 'saving' | 'done' | 'error'

interface ExtractedDNA {
  primaryFont?: string
  secondaryFont?: string
  headingWeight?: string
  bodyWeight?: string
  colors?: { primary?: string; secondary?: string; accent?: string; background?: string; text?: string }
  layoutPreference?: string
  visualStyle?: string
  shapeLanguage?: string
  tone?: string
  voiceRules?: { avoidWords?: string[]; preferredPhrases?: string[] }
}

function ColorSwatch({ hex }: { hex: string }) {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border border-neutral-200 shrink-0"
      style={{ backgroundColor: hex }}
    />
  )
}

function isHex(val: string) {
  return /^#[0-9a-fA-F]{3,8}$/.test(val)
}

function flattenDNA(dna: ExtractedDNA): { key: string; value: string }[] {
  const rows: { key: string; value: string }[] = []
  if (dna.primaryFont) rows.push({ key: 'Primary font', value: dna.primaryFont })
  if (dna.secondaryFont) rows.push({ key: 'Secondary font', value: dna.secondaryFont })
  if (dna.headingWeight) rows.push({ key: 'Heading weight', value: dna.headingWeight })
  if (dna.colors?.primary) rows.push({ key: 'Primary color', value: dna.colors.primary })
  if (dna.colors?.secondary) rows.push({ key: 'Secondary color', value: dna.colors.secondary })
  if (dna.colors?.accent) rows.push({ key: 'Accent color', value: dna.colors.accent })
  if (dna.colors?.background) rows.push({ key: 'Background', value: dna.colors.background })
  if (dna.colors?.text) rows.push({ key: 'Text color', value: dna.colors.text })
  if (dna.layoutPreference) rows.push({ key: 'Layout preference', value: dna.layoutPreference })
  if (dna.visualStyle) rows.push({ key: 'Visual style', value: dna.visualStyle })
  if (dna.shapeLanguage) rows.push({ key: 'Shape language', value: dna.shapeLanguage })
  if (dna.tone) rows.push({ key: 'Brand tone', value: dna.tone })
  if (dna.voiceRules?.preferredPhrases?.length) rows.push({ key: 'Preferred phrases', value: dna.voiceRules.preferredPhrases.join(', ') })
  if (dna.voiceRules?.avoidWords?.length) rows.push({ key: 'Avoid words', value: dna.voiceRules.avoidWords.join(', ') })
  return rows
}

export function BrandUploadZone() {
  const { activeBrand } = useBrand()
  const [stage, setStage] = useState<ParseStage>('idle')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [dna, setDna] = useState<ExtractedDNA | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.')
      setStage('error')
      return
    }

    setFileName(file.name)
    setStage('uploading')
    setProgress(15)

    const form = new FormData()
    form.append('file', file)

    setStage('extracting')
    setProgress(40)

    try {
      const res = await fetch('/api/brand-dna/extract', { method: 'POST', body: form })
      setProgress(85)

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Extraction failed')
      }

      const data = await res.json()
      setDna(data.dna)
      setPageCount(data.pageCount ?? 0)
      setProgress(100)
      setStage('reviewing')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong')
      setStage('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const applyDNA = async () => {
    if (!dna) return
    setStage('saving')

    try {
      const brandId = activeBrand?.id
      if (!brandId) throw new Error('No active brand selected')

      const res = await fetch('/api/brand-dna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, ...dna, isComplete: true }),
      })

      if (!res.ok) throw new Error('Failed to save')
      setStage('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save Brand DNA')
      setStage('error')
    }
  }

  if (stage === 'idle') {
    return (
      <div>
        <label
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed cursor-pointer transition-colors"
          style={{ borderColor: 'var(--border)', padding: '48px 24px' }}
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--brand-light)')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <input
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="rounded-full p-4" style={{ background: 'var(--brand-bg)' }}>
            <Upload className="h-8 w-8" style={{ color: 'var(--brand)' }} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: 'var(--fg)' }}>Upload Brand Guidelines PDF</p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
              Drag & drop or click to select · PDF only · Up to 50MB
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs rounded-full px-4 py-1.5" style={{ color: 'var(--brand)', background: 'var(--brand-bg)' }}>
            <Sparkles className="h-3 w-3" />
            AI will extract colors, fonts, tone, layout preferences and more
          </div>
        </label>

        <div className="mt-4 rounded-lg p-4" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--fg)' }}>What the AI will extract:</p>
          <div className="grid grid-cols-2 gap-1">
            {['Typography', 'Color System', 'Logo Rules', 'Layout Preferences', 'Visual Style', 'Voice & Tone', 'Spacing Rules', 'Image Treatment'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--fg-muted)' }}>
                <CheckCircle2 className="h-3 w-3" style={{ color: '#10b981' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'uploading' || stage === 'extracting') {
    return (
      <div className="py-8 text-center space-y-6">
        <div className="inline-flex rounded-full p-5" style={{ background: 'var(--brand-bg)' }}>
          <FileText className="h-8 w-8 animate-pulse" style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--fg)' }}>{fileName}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            {stage === 'uploading' ? 'Uploading document…' : 'Claude is reading your brand guidelines…'}
          </p>
        </div>
        <div className="max-w-xs mx-auto">
          <Progress value={progress} />
          <p className="text-xs mt-2" style={{ color: 'var(--fg-subtle)' }}>
            {stage === 'extracting' ? 'Extracting colors, fonts, tone, and layout rules…' : 'Preparing document…'}
          </p>
        </div>
      </div>
    )
  }

  if (stage === 'reviewing' && dna) {
    const rows = flattenDNA(dna)
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: '#16a34a' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#14532d' }}>Extraction complete</p>
            <p className="text-xs" style={{ color: '#166534' }}>
              {rows.length} brand attributes extracted from {fileName}{pageCount > 0 ? ` (${pageCount} pages)` : ''}
            </p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              Claude couldn't extract structured brand data from this PDF. Try uploading a brand guidelines document with clearly defined colors, fonts, and tone.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Review extracted values</p>
            <div className="space-y-2">
              {rows.map(({ key, value }) => (
                <div
                  key={key}
                  className="flex items-center justify-between rounded-lg px-4 py-2.5"
                  style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
                >
                  <span className="text-sm" style={{ color: 'var(--fg-muted)' }}>{key}</span>
                  <div className="flex items-center gap-2">
                    {isHex(value) && <ColorSwatch hex={value} />}
                    <span className="text-sm font-medium" style={{ color: 'var(--fg)' }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="brand"
            className="flex-1"
            onClick={applyDNA}
            disabled={rows.length === 0 || !activeBrand}
          >
            {activeBrand ? 'Apply to Brand DNA' : 'Select a brand first'}
          </Button>
          <Button variant="outline" onClick={() => { setStage('idle'); setDna(null) }}>
            Re-upload
          </Button>
        </div>
      </div>
    )
  }

  if (stage === 'saving') {
    return (
      <div className="py-10 text-center space-y-4">
        <RefreshCw className="h-10 w-10 mx-auto animate-spin" style={{ color: 'var(--brand)' }} />
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>Saving Brand DNA…</p>
      </div>
    )
  }

  if (stage === 'done') {
    return (
      <div className="py-10 text-center space-y-4">
        <div className="inline-flex rounded-full p-5" style={{ background: '#f0fdf4' }}>
          <CheckCircle2 className="h-10 w-10" style={{ color: '#16a34a' }} />
        </div>
        <div>
          <p className="text-lg font-semibold" style={{ color: 'var(--fg)' }}>Brand DNA Applied!</p>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            Your brand guidelines are now active. All generated assets will follow these rules.
          </p>
        </div>
        <Button variant="outline" onClick={() => { setStage('idle'); setDna(null) }}>Upload another file</Button>
      </div>
    )
  }

  return (
    <div className="py-8 text-center space-y-4">
      <AlertCircle className="h-10 w-10 mx-auto" style={{ color: '#f43f5e' }} />
      <div>
        <p className="font-medium" style={{ color: 'var(--fg)' }}>Extraction failed</p>
        <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>{errorMsg}</p>
      </div>
      <Button variant="outline" onClick={() => { setStage('idle'); setErrorMsg('') }}>Try Again</Button>
    </div>
  )
}
