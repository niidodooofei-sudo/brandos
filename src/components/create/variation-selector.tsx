'use client'

import { useState } from 'react'
import { ArrowLeft, RefreshCw, Download, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScoreRing } from '@/components/ui/score-ring'
import { Badge } from '@/components/ui/badge'
import { ExportModal } from '@/components/create/export-modal'
import { ScoreBreakdownPanel } from '@/components/create/score-breakdown'
import { cn } from '@/lib/utils'
import type { OutputType, ContentInputs } from '@/types'

interface Variation {
  id: string
  blueprintId: string
  layoutName: string
  thumbnailDataUrl: string
  canvasData: Record<string, unknown>
  score: number
}

interface VariationSelectorProps {
  result: { assetId: string; variations: Variation[] }
  outputType: OutputType
  contentInputs: ContentInputs
  onBack: () => void
  onRegenerate: () => void
}

export function VariationSelector({ result, outputType, contentInputs, onBack, onRegenerate }: VariationSelectorProps) {
  const [selected, setSelected] = useState(0)
  const [showExport, setShowExport] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  const current = result.variations[selected]

  const handleRegenerate = async () => {
    setRegenerating(true)
    await onRegenerate()
    setRegenerating(false)
  }

  return (
    <div className="max-w-[1200px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="rounded-lg p-2 hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="h-4 w-4 text-neutral-600" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-neutral-900">Choose Your Design</h1>
            <p className="text-sm text-neutral-500">{outputType.name} · {result.variations.length} variations generated</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRegenerate} isLoading={regenerating} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
          <Button size="sm" onClick={() => setShowExport(true)} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variation thumbnails */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {result.variations.map((variation, i) => (
              <button
                key={variation.id}
                onClick={() => setSelected(i)}
                className={cn(
                  'relative rounded-2xl overflow-hidden border-2 transition-all text-left',
                  selected === i
                    ? 'border-indigo-500 shadow-lg shadow-indigo-100'
                    : 'border-neutral-200 hover:border-neutral-400'
                )}
              >
                {/* Canvas thumbnail */}
                <div className="relative bg-neutral-100" style={{ aspectRatio: outputType.width / outputType.height }}>
                  {variation.thumbnailDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={variation.thumbnailDataUrl}
                      alt={variation.layoutName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <CanvasMock variation={variation} contentInputs={contentInputs} />
                  )}

                  {selected === i && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle2 className="h-6 w-6 text-indigo-500 bg-white rounded-full" />
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-3 py-2.5 bg-white flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-800">{variation.layoutName}</p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">Variation {i + 1}</p>
                  </div>
                  <ScoreRing score={variation.score} size={38} strokeWidth={3.5} />
                </div>
              </button>
            ))}
          </div>

          {/* Keyboard shortcut hint */}
          <p className="text-xs text-neutral-400 text-center">
            Press <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono">1</kbd>
            –<kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono">4</kbd> to select · <kbd className="rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 text-[10px] font-mono">⌘E</kbd> to export
          </p>
        </div>

        {/* Right panel: Score + details */}
        <div className="space-y-4">
          {/* Brand score card */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center gap-4 mb-5">
              <ScoreRing score={current?.score || 0} size={72} strokeWidth={6} />
              <div>
                <p className="text-sm font-semibold text-neutral-900">Brand Compliance</p>
                <p className="text-xs text-neutral-500 mt-0.5">{current?.layoutName}</p>
                <Badge
                  className="mt-1.5"
                  variant={
                    (current?.score || 0) >= 90 ? 'success' :
                    (current?.score || 0) >= 75 ? 'warning' : 'danger'
                  }
                >
                  {(current?.score || 0) >= 90 ? 'Excellent' : (current?.score || 0) >= 75 ? 'Good' : 'Needs Review'}
                </Badge>
              </div>
            </div>
            <ScoreBreakdownPanel
              breakdown={{
                colors: 18,
                typography: 17,
                logo: 19,
                spacing: 17,
                tone: current ? Math.max(14, current.score - 73) : 16,
                total: current?.score || 85,
              }}
            />
          </div>

          {/* Content summary */}
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-2.5">
            <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Content</p>
            {contentInputs.headline && (
              <div>
                <p className="text-[10px] text-neutral-400">Headline</p>
                <p className="text-sm font-medium text-neutral-900">{contentInputs.headline}</p>
              </div>
            )}
            {contentInputs.cta && (
              <div>
                <p className="text-[10px] text-neutral-400">CTA</p>
                <p className="text-sm text-neutral-900">{contentInputs.cta}</p>
              </div>
            )}
            {(contentInputs.images?.length || 0) > 0 && (
              <div>
                <p className="text-[10px] text-neutral-400">Images</p>
                <p className="text-sm text-neutral-900">{contentInputs.images?.length} uploaded</p>
              </div>
            )}
          </div>

          {/* Export CTA */}
          <Button onClick={() => setShowExport(true)} className="w-full gap-2" size="lg">
            <Download className="h-4 w-4" />
            Export Design
          </Button>
          <Button variant="outline" className="w-full" onClick={() => {}}>
            Save to Library
          </Button>
        </div>
      </div>

      {showExport && current && (
        <ExportModal
          assetId={result.assetId}
          variationId={current.id}
          outputType={outputType}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  )
}

function CanvasMock({ variation, contentInputs }: { variation: Variation; contentInputs: ContentInputs }) {
  const bg = (variation.canvasData?.background as Record<string, unknown>)
  const overlayStyle = variation.canvasData?.overlay as Record<string, unknown> | undefined
  const overlayOpacity = overlayStyle?.opacity as number || 0

  const colors = ['#1a1a2e', '#e94560', '#0f3460', '#533483', '#2b2d42']
  const color = colors[Math.abs(variation.id.charCodeAt(variation.id.length - 1) - 48) % colors.length]

  return (
    <div className="absolute inset-0 flex flex-col justify-end p-4" style={{ backgroundColor: (bg?.color as string) || color }}>
      {overlayOpacity > 0 && (
        <div className="absolute inset-0" style={{ backgroundColor: color, opacity: overlayOpacity }} />
      )}
      <div className="relative z-10">
        <p className="text-white font-bold text-sm leading-tight line-clamp-2">{contentInputs.headline}</p>
        {contentInputs.subheadline && (
          <p className="text-white/60 text-xs mt-1 line-clamp-1">{contentInputs.subheadline}</p>
        )}
        {contentInputs.cta && (
          <div className="mt-2 inline-block bg-white/20 backdrop-blur text-white text-[10px] font-semibold px-2.5 py-1 rounded-md">
            {contentInputs.cta}
          </div>
        )}
      </div>
    </div>
  )
}
