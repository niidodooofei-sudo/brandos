'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useBrand } from '@/contexts/brand-context'

type ParseStage = 'idle' | 'reading' | 'extracting' | 'reviewing' | 'saving' | 'done' | 'error'

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

function isHex(val: string) {
  return /^#[0-9a-fA-F]{3,8}$/.test(val)
}

function ColorSwatch({ hex }: { hex: string }) {
  return <span className="inline-block h-4 w-4 rounded-full border border-neutral-200 shrink-0" style={{ backgroundColor: hex }} />
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

// Extract text from PDF entirely in the browser — no server upload needed
async function extractPDFText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs')

  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise

  const parts: string[] = []
  const maxPages = Math.min(pdf.numPages, 40)
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    parts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
    page.cleanup()
  }
  await pdf.destroy()
  return parts.join('\n')
}

export function BrandUploadZone() {
  const { activeBrand } = useBrand()
  const [stage, setStage] = useState<ParseStage>('idle')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [dna, setDna] = useState<ExtractedDNA | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setErrorMsg('Only PDF files are supported.')
      setStage('error')
      return
    }

    setFileName(file.name)
    setStage('reading')
    setProgress(20)

    try {
      // Step 1: Extract text in the browser (no upload size limit)
      const text = await extractPDFText(file)
      setProgress(55)

      if (!text || text.trim().length < 50) {
        throw new Error('Could not read text from this PDF. Make sure it is not a scanned image.')
      }

      // Step 2: Send text to API for Claude to analyse
      setStage('extracting')
      setProgress(70)

      const res = await fetch('/api/brand-dna/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })

      const rawText = await res.text()
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`
        try { errMsg = JSON.parse(rawText).error || errMsg } catch { errMsg = rawText.slice(0, 150) || errMsg }
        throw new Error(errMsg)
      }

      const data = JSON.parse(rawText)
      setDna(data.dna)
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
      if (!brandId) throw new Error('No active brand selected. Pick one from the sidebar first.')

      const res = await fetch('/api/brand-dna', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandId, ...dna, isComplete: true }),
      })
      if (!res.ok) throw new Error('Failed to save Brand DNA')
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
          <input type="file" accept=".pdf" className="sr-only" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <div className="rounded-full p-4" style={{ background: 'var(--brand-bg)' }}>
            <Upload className="h-8 w-8" style={{ color: 'var(--brand)' }} />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold" style={{ color: 'var(--fg)' }}>Upload Brand Guidelines PDF</p>
            <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>Drag & drop or click · PDF only · Any size</p>
          </div>
          <div className="flex items-center gap-2 text-xs rounded-full px-4 py-1.5" style={{ color: 'var(--brand)', background: 'var(--brand-bg)' }}>
            <Sparkles className="h-3 w-3" />
            AI will extract colors, fonts, tone, layout preferences and more
          </div>
        </label>
        <div className="mt-4 rounded-lg p-4" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--fg)' }}>What the AI extracts:</p>
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

  if (stage === 'reading' || stage === 'extracting') {
    return (
      <div className="py-8 text-center space-y-6">
        <div className="inline-flex rounded-full p-5" style={{ background: 'var(--brand-bg)' }}>
          <FileText className="h-8 w-8 animate-pulse" style={{ color: 'var(--brand)' }} />
        </div>
        <div>
          <p className="font-medium" style={{ color: 'var(--fg)' }}>{fileName}</p>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            {stage === 'reading' ? 'Reading PDF pages…' : 'Claude is extracting your brand guidelines…'}
          </p>
        </div>
        <div className="max-w-xs mx-auto">
          <Progress value={progress} />
          <p className="text-xs mt-2" style={{ color: 'var(--fg-subtle)' }}>
            {stage === 'reading' ? 'Parsing document text locally…' : 'Identifying colors, fonts, tone, and layout rules…'}
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
            <p className="text-xs" style={{ color: '#166534' }}>{rows.length} brand attributes extracted from {fileName}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--fg-muted)' }}>
            Claude couldn't find structured brand data. Try a brand guidelines document with defined colors, fonts, and tone.
          </p>
        ) : (
          <div>
            <p className="text-sm font-medium mb-3" style={{ color: 'var(--fg)' }}>Review extracted values</p>
            <div className="space-y-2">
              {rows.map(({ key, value }) => (
                <div key={key} className="flex items-center justify-between rounded-lg px-4 py-2.5" style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}>
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
          <Button variant="brand" className="flex-1" onClick={applyDNA} disabled={rows.length === 0 || !activeBrand}>
            {activeBrand ? 'Apply to Brand DNA' : 'Select a brand first'}
          </Button>
          <Button variant="outline" onClick={() => { setStage('idle'); setDna(null) }}>Re-upload</Button>
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
