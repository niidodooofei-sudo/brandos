'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ImageUpload } from '@/components/ui/image-upload'
import { VariationSelector } from '@/components/create/variation-selector'
import type { OutputType, ContentInputs } from '@/types'

interface CreateFormProps {
  outputType: OutputType
}

interface GeneratedResult {
  assetId: string
  variations: Array<{
    id: string
    blueprintId: string
    layoutName: string
    thumbnailDataUrl: string
    canvasData: Record<string, unknown>
    score: number
  }>
}

export function CreateForm({ outputType }: CreateFormProps) {
  const [inputs, setInputs] = useState<ContentInputs>({ headline: '' })
  const [generating, setGenerating] = useState(false)
  const [generateStage, setGenerateStage] = useState('')
  const [result, setResult] = useState<GeneratedResult | null>(null)
  const [copySuggestions, setCopySuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [error, setError] = useState('')

  const set = useCallback(<K extends keyof ContentInputs>(key: K, val: ContentInputs[K]) => {
    setInputs(prev => ({ ...prev, [key]: val }))
  }, [])

  const fetchCopySuggestions = async () => {
    if (!inputs.headline) return
    setLoadingSuggestions(true)
    try {
      const res = await fetch('/api/ai/copy-suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ headline: inputs.headline, outputType: outputType.id }),
      })
      const data = await res.json()
      setCopySuggestions(data.suggestions || [])
    } finally {
      setLoadingSuggestions(false)
    }
  }

  const generate = async () => {
    if (!inputs.headline) { setError('Headline is required.'); return }
    setError('')
    setGenerating(true)
    setResult(null)

    const stages = [
      'Analyzing content…',
      'Selecting layouts…',
      'Assembling designs…',
      'Scoring brand compliance…',
    ]
    for (const stage of stages) {
      setGenerateStage(stage)
      await delay(600)
    }

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outputType: outputType.id, contentInputs: inputs }),
      })
      if (!res.ok) throw new Error('Generation failed')
      const data = await res.json()
      setResult(data)
    } catch {
      setError('Generation failed. Please try again.')
    } finally {
      setGenerating(false)
      setGenerateStage('')
    }
  }

  if (result) {
    return (
      <VariationSelector
        result={result}
        outputType={outputType}
        contentInputs={inputs}
        onBack={() => setResult(null)}
        onRegenerate={generate}
      />
    )
  }

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/create" className="rounded-lg p-2 hover:bg-neutral-100 transition-colors">
          <ArrowLeft className="h-4 w-4 text-neutral-600" />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">{outputType.icon}</span>
            <h1 className="text-xl font-semibold text-neutral-900">{outputType.name}</h1>
            <span className="text-xs text-neutral-400 border border-neutral-200 rounded-full px-2 py-0.5">{outputType.description}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form panel */}
        <div className="space-y-5">
          {/* Headline */}
          <div>
            <Input
              label="Headline"
              required
              placeholder="Your main message here…"
              value={inputs.headline}
              onChange={(e) => set('headline', e.target.value)}
              maxChars={55}
              charCount={inputs.headline.length}
              error={error && !inputs.headline ? 'Headline is required' : undefined}
            />
            {inputs.headline.length > 5 && (
              <button
                type="button"
                onClick={fetchCopySuggestions}
                disabled={loadingSuggestions}
                className="mt-1.5 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                <Lightbulb className="h-3 w-3" />
                {loadingSuggestions ? 'Getting suggestions…' : 'AI copy suggestions'}
              </button>
            )}
            {copySuggestions.length > 0 && (
              <div className="mt-2 space-y-1">
                {copySuggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { set('headline', s); setCopySuggestions([]) }}
                    className="w-full text-left rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-sm text-indigo-800 hover:bg-indigo-100 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Input
            label="Subheadline"
            placeholder="Supporting line…"
            value={inputs.subheadline || ''}
            onChange={(e) => set('subheadline', e.target.value)}
          />

          <Textarea
            label="Body Copy"
            placeholder="Additional details, description, or offer information…"
            value={inputs.body || ''}
            onChange={(e) => set('body', e.target.value)}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="CTA Text"
              placeholder="e.g. Shop Now, Learn More"
              value={inputs.cta || ''}
              onChange={(e) => set('cta', e.target.value)}
            />
            <Input
              label="CTA URL"
              type="url"
              placeholder="https://…"
              value={inputs.ctaUrl || ''}
              onChange={(e) => set('ctaUrl', e.target.value)}
            />
          </div>

          <ImageUpload
            label="Images"
            value={inputs.images || []}
            onChange={(urls) => set('images', urls)}
            maxFiles={3}
            hint="Upload hero images. The AI will handle cropping and treatment."
          />

          <Input
            label="Offer / Promo Details"
            placeholder="e.g. 40% off, Free shipping, Limited time"
            value={inputs.offerDetails || ''}
            onChange={(e) => set('offerDetails', e.target.value)}
          />

          <Input
            label="Dates"
            placeholder="e.g. 15–30 June 2026"
            value={inputs.dates || ''}
            onChange={(e) => set('dates', e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 rounded-lg bg-red-50 px-3 py-2">{error}</p>
          )}

          <Button
            onClick={generate}
            size="lg"
            isLoading={generating}
            className="w-full gap-2 text-base h-12"
          >
            {!generating && <Sparkles className="h-4 w-4" />}
            {generating ? generateStage || 'Generating…' : 'Generate'}
          </Button>
        </div>

        {/* Right panel: preview + tips */}
        <div className="space-y-5">
          {/* Canvas mock preview */}
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-neutral-200 flex items-center justify-between">
              <p className="text-xs font-medium text-neutral-600">Live Preview</p>
              <span className="text-xs text-neutral-400">{outputType.width} × {outputType.height}px</span>
            </div>
            <div className="p-6 flex items-center justify-center" style={{ minHeight: 280 }}>
              {inputs.headline ? (
                <div
                  className="rounded-xl overflow-hidden shadow-lg relative flex items-end"
                  style={{
                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
                    aspectRatio: outputType.width / outputType.height,
                    maxWidth: 280,
                    width: '100%',
                  }}
                >
                  {inputs.images?.[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={inputs.images[0]} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  )}
                  <div className="relative z-10 p-4 w-full">
                    <p className="text-white font-bold leading-tight" style={{ fontSize: 'clamp(12px, 4vw, 20px)' }}>
                      {inputs.headline}
                    </p>
                    {inputs.subheadline && (
                      <p className="text-white/70 text-xs mt-1">{inputs.subheadline}</p>
                    )}
                    {inputs.cta && (
                      <div className="mt-3 inline-block bg-indigo-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        {inputs.cta}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center text-neutral-300">
                  <div className="text-5xl mb-3">{outputType.icon}</div>
                  <p className="text-sm">Enter a headline to preview</p>
                </div>
              )}
            </div>
          </div>

          {/* AI tips */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <p className="text-sm font-medium text-indigo-900">AI Design Notes</p>
            </div>
            <ul className="space-y-1.5 text-xs text-indigo-700">
              <li>• Headline under 35 chars → large display typography</li>
              <li>• Adding an image → 4 layout variations including image-led</li>
              <li>• With CTA → CTA zone is prominently placed</li>
              <li>• Your Brand DNA is loaded — colors and fonts are automatic</li>
            </ul>
          </div>

          {/* Format info */}
          <div className="rounded-xl border border-neutral-100 p-4 space-y-2">
            <p className="text-xs font-medium text-neutral-600">Output Formats on Export</p>
            <div className="flex gap-2">
              {['PNG', 'JPG', 'PDF', 'SVG'].map((fmt) => (
                <span key={fmt} className="text-xs border border-neutral-200 rounded-full px-2.5 py-1 text-neutral-600">{fmt}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
