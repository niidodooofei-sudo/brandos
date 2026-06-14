'use client'

import { useState } from 'react'
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

type ParseStage = 'idle' | 'uploading' | 'parsing' | 'reviewing' | 'done' | 'error'

export function BrandUploadZone() {
  const [stage, setStage] = useState<ParseStage>('idle')
  const [fileName, setFileName] = useState('')
  const [progress, setProgress] = useState(0)
  const [extractedFields, setExtractedFields] = useState<string[]>([])

  const handleFile = async (file: File) => {
    setFileName(file.name)
    setStage('uploading')
    setProgress(20)

    await delay(800)
    setStage('parsing')
    setProgress(50)

    await delay(1500)
    setProgress(80)
    await delay(600)

    // Simulate extracted fields
    setExtractedFields([
      'Primary font: Inter',
      'Secondary font: Georgia',
      'Primary color: #1a1a2e',
      'Accent color: #e94560',
      'Background: #ffffff',
      'Layout preference: minimalist',
      'Tone: professional',
      'Visual style: photography',
    ])
    setStage('reviewing')
    setProgress(100)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') handleFile(file)
  }

  const applyExtracted = async () => {
    setStage('done')
    // In production: POST /api/brand-dna with extracted fields
  }

  if (stage === 'idle') {
    return (
      <div>
        <label
          className="flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-neutral-200 p-12 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".pdf"
            className="sr-only"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <div className="rounded-full bg-indigo-100 p-4">
            <Upload className="h-8 w-8 text-indigo-600" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-neutral-900">Upload Brand Guidelines PDF</p>
            <p className="text-sm text-neutral-500 mt-1">
              Drag & drop or click to select · PDF format · Up to 50MB
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-indigo-600 bg-indigo-50 rounded-full px-4 py-1.5">
            <Sparkles className="h-3 w-3" />
            AI will extract colors, fonts, tone, layout preferences and more
          </div>
        </label>

        <div className="mt-4 rounded-lg bg-neutral-50 p-4">
          <p className="text-xs font-medium text-neutral-700 mb-2">What the AI will extract:</p>
          <div className="grid grid-cols-2 gap-1">
            {['Typography', 'Color System', 'Logo Rules', 'Layout Preferences', 'Visual Style', 'Voice & Tone', 'Spacing Rules', 'Image Treatment'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 text-xs text-neutral-600">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (stage === 'uploading' || stage === 'parsing') {
    return (
      <div className="py-8 text-center space-y-6">
        <div className="inline-flex rounded-full bg-indigo-100 p-5">
          <FileText className="h-8 w-8 text-indigo-600 animate-pulse" />
        </div>
        <div>
          <p className="font-medium text-neutral-900">{fileName}</p>
          <p className="text-sm text-neutral-500 mt-1">
            {stage === 'uploading' ? 'Uploading document…' : 'AI is reading your brand guidelines…'}
          </p>
        </div>
        <div className="max-w-xs mx-auto">
          <Progress value={progress} barClassName="bg-indigo-500" />
          <p className="text-xs text-neutral-400 mt-2">
            {stage === 'parsing' ? 'Extracting brand rules, colors, fonts, and tone…' : 'Preparing document…'}
          </p>
        </div>
      </div>
    )
  }

  if (stage === 'reviewing') {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-green-900">Extraction complete</p>
            <p className="text-xs text-green-700">{extractedFields.length} brand rules extracted from {fileName}</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-neutral-700 mb-3">Review extracted values</p>
          <div className="space-y-2">
            {extractedFields.map((field, i) => {
              const [key, val] = field.split(': ')
              const isColor = val?.startsWith('#')
              return (
                <div key={i} className="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-2.5">
                  <span className="text-sm text-neutral-600">{key}</span>
                  <div className="flex items-center gap-2">
                    {isColor && (
                      <span className="inline-block h-4 w-4 rounded-full border border-neutral-200" style={{ backgroundColor: val }} />
                    )}
                    <span className="text-sm font-medium text-neutral-900">{val}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={applyExtracted} className="flex-1">
            Apply to Brand DNA
          </Button>
          <Button variant="outline" onClick={() => setStage('idle')}>
            Re-upload
          </Button>
        </div>
      </div>
    )
  }

  if (stage === 'done') {
    return (
      <div className="py-10 text-center space-y-4">
        <div className="inline-flex rounded-full bg-green-100 p-5">
          <CheckCircle2 className="h-10 w-10 text-green-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-neutral-900">Brand DNA Applied!</p>
          <p className="text-sm text-neutral-500 mt-1">
            Your brand guidelines are now active. All generated assets will follow these rules.
          </p>
        </div>
        <Button variant="outline" onClick={() => setStage('idle')}>Upload another file</Button>
      </div>
    )
  }

  return (
    <div className="py-8 text-center space-y-4">
      <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
      <p className="text-neutral-600">Something went wrong. Please try again.</p>
      <Button variant="outline" onClick={() => setStage('idle')}>Try Again</Button>
    </div>
  )
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
