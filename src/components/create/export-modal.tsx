'use client'

import { useState } from 'react'
import { X, Download, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { OutputType } from '@/types'

const formats = [
  { id: 'PNG', label: 'PNG', desc: 'Lossless, transparent background support', icon: '🖼️' },
  { id: 'JPG', label: 'JPG', desc: 'Compressed, ideal for web and social', icon: '📷' },
  { id: 'PDF', label: 'PDF', desc: 'Print-ready vector, best for print formats', icon: '📄' },
  { id: 'SVG', label: 'SVG', desc: 'Scalable vector, developer use', icon: '⚡' },
]

interface ExportModalProps {
  assetId: string
  variationId: string
  outputType: OutputType
  onClose: () => void
}

type ExportState = 'select' | 'exporting' | 'done'

export function ExportModal({ assetId, variationId, outputType, onClose }: ExportModalProps) {
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['PNG'])
  const [state, setState] = useState<ExportState>('select')
  const [downloadUrl, setDownloadUrl] = useState('')

  const toggle = (fmt: string) => {
    setSelectedFormats(prev =>
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    )
  }

  const handleExport = async () => {
    setState('exporting')
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, variationId, formats: selectedFormats }),
      })
      const data = await res.json()
      setDownloadUrl(data.downloadUrl || '')
      setState('done')
    } catch {
      setState('done')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="text-base font-semibold text-neutral-900">Export Asset</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-neutral-100 transition-colors">
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        <div className="p-6">
          {state === 'select' && (
            <>
              <p className="text-sm text-neutral-600 mb-4">
                {outputType.name} · {outputType.width} × {outputType.height}px
              </p>
              <div className="space-y-2 mb-6">
                {formats.map((fmt) => (
                  <label key={fmt.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 p-3.5 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedFormats.includes(fmt.id)}
                      onChange={() => toggle(fmt.id)}
                      className="rounded accent-indigo-600 h-4 w-4"
                    />
                    <span className="text-xl">{fmt.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{fmt.label}</p>
                      <p className="text-xs text-neutral-500">{fmt.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleExport}
                  disabled={selectedFormats.length === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  <Download className="h-4 w-4" />
                  Export {selectedFormats.length > 0 ? `(${selectedFormats.join(', ')})` : ''}
                </Button>
                <Button variant="outline" onClick={onClose} className="w-full">Cancel</Button>
              </div>
            </>
          )}

          {state === 'exporting' && (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex rounded-full bg-indigo-100 p-5">
                <svg className="h-8 w-8 text-indigo-600 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              </div>
              <p className="font-medium text-neutral-900">Preparing your files…</p>
              <p className="text-sm text-neutral-500">Rendering at full resolution</p>
            </div>
          )}

          {state === 'done' && (
            <div className="py-8 text-center space-y-4">
              <div className="inline-flex rounded-full bg-green-100 p-5">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <p className="font-medium text-neutral-900">Ready to download!</p>
              <div className="space-y-2">
                {downloadUrl ? (
                  <a href={downloadUrl} download>
                    <Button className="w-full gap-2">
                      <Download className="h-4 w-4" /> Download Files
                    </Button>
                  </a>
                ) : (
                  <Button onClick={() => {}} className="w-full gap-2">
                    <Download className="h-4 w-4" /> Download Files
                  </Button>
                )}
                <Button variant="outline" onClick={onClose} className="w-full">Close</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
