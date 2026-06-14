'use client'

import {
  useState, useRef, useCallback, useEffect, type PointerEvent as ReactPointerEvent
} from 'react'
import { X, Trash2, MousePointer2, Pencil, Save, Upload, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type ZoneType = 'photo' | 'headline' | 'subheadline' | 'body' | 'cta' | 'logo'

export interface TemplateZone {
  id: string
  type: ZoneType
  // all values 0–1 (relative to container)
  x: number
  y: number
  w: number
  h: number
}

export interface CustomTemplate {
  id: string
  name: string
  backgroundDataUrl: string
  zones: TemplateZone[]
  createdAt: number
}

export const ZONE_META: Record<ZoneType, { label: string; color: string; bg: string; border: string }> = {
  photo:        { label: 'Photo',        color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: '#3b82f6' },
  headline:     { label: 'Headline',     color: '#7c3aed', bg: 'rgba(124,58,237,0.12)', border: '#7c3aed' },
  subheadline:  { label: 'Sub-headline', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', border: '#8b5cf6' },
  body:         { label: 'Body Copy',    color: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: '#6b7280' },
  cta:          { label: 'CTA Button',   color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: '#f97316' },
  logo:         { label: 'Logo',         color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: '#f59e0b' },
}

function zoneId() {
  return `z_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

interface DrawState { x0: number; y0: number; x1: number; y1: number }

interface Props {
  onSave: (template: CustomTemplate) => void
  onCancel: () => void
}

export function TemplateBuilder({ onSave, onCancel }: Props) {
  const [backgroundUrl, setBackgroundUrl] = useState<string | null>(null)
  const [zones, setZones] = useState<TemplateZone[]>([])
  const [draw, setDraw] = useState<DrawState | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mode, setMode] = useState<'draw' | 'select'>('draw')
  const [drawType, setDrawType] = useState<ZoneType>('headline')
  const [pendingZone, setPendingZone] = useState<{ rect: DrawState } | null>(null)
  const [templateName, setTemplateName] = useState('My Template')
  const [labelsVisible, setLabelsVisible] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Upload background
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setBackgroundUrl(ev.target?.result as string)
    reader.readAsDataURL(file)
  }, [])

  // Relative coords
  const rel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current!.getBoundingClientRect()
    return {
      x: Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height)),
    }
  }, [])

  const onPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (mode !== 'draw') return
    e.currentTarget.setPointerCapture(e.pointerId)
    const { x, y } = rel(e)
    setDraw({ x0: x, y0: y, x1: x, y1: y })
    setSelectedId(null)
  }, [mode, rel])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draw) return
    const { x, y } = rel(e)
    setDraw(d => d ? { ...d, x1: x, y1: y } : null)
  }, [draw, rel])

  const onPointerUp = useCallback(() => {
    if (!draw) return
    const minSize = 0.04
    const w = Math.abs(draw.x1 - draw.x0)
    const h = Math.abs(draw.y1 - draw.y0)
    if (w >= minSize && h >= minSize) {
      // Show type picker inline by committing with current drawType
      const zone: TemplateZone = {
        id: zoneId(),
        type: drawType,
        x: Math.min(draw.x0, draw.x1),
        y: Math.min(draw.y0, draw.y1),
        w,
        h,
      }
      setZones(z => [...z, zone])
      setSelectedId(zone.id)
    }
    setDraw(null)
    setPendingZone(null)
  }, [draw, drawType])

  const deleteZone = useCallback((id: string) => {
    setZones(z => z.filter(z => z.id !== id))
    if (selectedId === id) setSelectedId(null)
  }, [selectedId])

  const changeZoneType = useCallback((id: string, type: ZoneType) => {
    setZones(z => z.map(z => z.id === id ? { ...z, type } : z))
  }, [])

  const handleSave = () => {
    if (!backgroundUrl || !templateName.trim()) return
    const template: CustomTemplate = {
      id: `tpl_${Date.now()}`,
      name: templateName.trim(),
      backgroundDataUrl: backgroundUrl,
      zones,
      createdAt: Date.now(),
    }
    onSave(template)
  }

  // Draw rect overlay coords (px from %)
  const drawRect = draw
    ? {
        left: `${Math.min(draw.x0, draw.x1) * 100}%`,
        top: `${Math.min(draw.y0, draw.y1) * 100}%`,
        width: `${Math.abs(draw.x1 - draw.x0) * 100}%`,
        height: `${Math.abs(draw.y1 - draw.y0) * 100}%`,
      }
    : null

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: 'rgba(7,6,15,0.7)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="m-auto w-full max-w-6xl max-h-[92vh] rounded-2xl flex flex-col overflow-hidden animate-scale-in"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-xl)' }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 px-6 py-4 shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div className="flex-1">
            <input
              type="text"
              value={templateName}
              onChange={e => setTemplateName(e.target.value)}
              className="text-base font-semibold bg-transparent border-none outline-none w-full"
              style={{ color: 'var(--fg)' }}
              placeholder="Template name…"
            />
            <p className="text-xs mt-0.5" style={{ color: 'var(--fg-muted)' }}>
              {zones.length} zones defined
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLabelsVisible(v => !v)} className="gap-1.5">
              {labelsVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              Labels
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
            <Button
              variant="brand"
              size="sm"
              onClick={handleSave}
              disabled={!backgroundUrl || zones.length === 0}
              className="gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              Save Template
            </Button>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Left toolbar */}
          <div
            className="w-64 shrink-0 flex flex-col gap-0 overflow-y-auto"
            style={{ borderRight: '1px solid var(--border)' }}
          >
            {/* Mode */}
            <div className="p-4 space-y-1" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--fg-subtle)' }}>
                Mode
              </p>
              {([
                { m: 'draw' as const, icon: Pencil, label: 'Draw Zone' },
                { m: 'select' as const, icon: MousePointer2, label: 'Select' },
              ] as const).map(({ m, icon: Icon, label }) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left',
                  )}
                  style={
                    mode === m
                      ? { background: 'var(--brand-bg)', color: 'var(--brand)' }
                      : { color: 'var(--fg-muted)' }
                  }
                  onMouseEnter={e => { if (mode !== m) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)' }}
                  onMouseLeave={e => { if (mode !== m) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </div>

            {/* Zone type picker */}
            {mode === 'draw' && (
              <div className="p-4 space-y-1" style={{ borderBottom: '1px solid var(--border)' }}>
                <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--fg-subtle)' }}>
                  Zone Type
                </p>
                {(Object.entries(ZONE_META) as [ZoneType, typeof ZONE_META[ZoneType]][]).map(([type, meta]) => (
                  <button
                    key={type}
                    onClick={() => setDrawType(type)}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-left transition-colors"
                    style={
                      drawType === type
                        ? { background: meta.bg, color: meta.color, fontWeight: 600 }
                        : { color: 'var(--fg-muted)' }
                    }
                    onMouseEnter={e => { if (drawType !== type) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)' }}
                    onMouseLeave={e => { if (drawType !== type) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </button>
                ))}
              </div>
            )}

            {/* Defined zones */}
            <div className="p-4 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--fg-subtle)' }}>
                Zones ({zones.length})
              </p>
              {zones.length === 0 ? (
                <p className="text-xs" style={{ color: 'var(--fg-subtle)' }}>
                  {backgroundUrl ? 'Draw zones on the canvas →' : 'Upload a template image first'}
                </p>
              ) : (
                <div className="space-y-1">
                  {zones.map((z, i) => {
                    const meta = ZONE_META[z.type]
                    return (
                      <div
                        key={z.id}
                        className="flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors"
                        style={{
                          background: selectedId === z.id ? meta.bg : 'transparent',
                          border: `1px solid ${selectedId === z.id ? meta.border + '60' : 'transparent'}`,
                        }}
                        onClick={() => setSelectedId(z.id)}
                      >
                        <span className="h-2 w-2 rounded-sm shrink-0" style={{ background: meta.color }} />
                        <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--fg-muted)' }}>
                          {meta.label} {i + 1}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); deleteZone(z.id) }}
                          className="h-5 w-5 rounded flex items-center justify-center transition-colors"
                          style={{ color: 'var(--fg-subtle)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#f43f5e' }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--fg-subtle)' }}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Canvas area */}
          <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden" style={{ background: 'var(--surface-muted)' }}>
            {!backgroundUrl ? (
              <div
                className="flex flex-col items-center justify-center gap-4 rounded-2xl cursor-pointer transition-all w-full max-w-lg h-72"
                style={{ border: '2px dashed var(--border)', color: 'var(--fg-subtle)' }}
                onClick={() => fileRef.current?.click()}
                onMouseEnter={e => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--brand-light)'
                  ;(e.currentTarget as HTMLDivElement).style.color = 'var(--brand)'
                  ;(e.currentTarget as HTMLDivElement).style.background = 'var(--brand-bg)'
                }}
                onMouseLeave={e => {
                  ;(e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'
                  ;(e.currentTarget as HTMLDivElement).style.color = 'var(--fg-subtle)'
                  ;(e.currentTarget as HTMLDivElement).style.background = 'transparent'
                }}
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--brand-bg)' }}
                >
                  <Upload className="h-7 w-7" style={{ color: 'var(--brand)' }} />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold">Upload Template Image</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--fg-subtle)' }}>PNG, JPG, or WebP — any aspect ratio</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div
                  ref={containerRef}
                  className="relative"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    cursor: mode === 'draw' ? 'crosshair' : 'default',
                    userSelect: 'none',
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  {/* Background image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={backgroundUrl}
                    alt="Template background"
                    className="block rounded-lg pointer-events-none"
                    style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }}
                    draggable={false}
                  />

                  {/* Existing zones */}
                  {zones.map((z) => {
                    const meta = ZONE_META[z.type]
                    const isSelected = z.id === selectedId
                    return (
                      <div
                        key={z.id}
                        className="absolute"
                        style={{
                          left: `${z.x * 100}%`,
                          top: `${z.y * 100}%`,
                          width: `${z.w * 100}%`,
                          height: `${z.h * 100}%`,
                          background: meta.bg,
                          border: `2px solid ${meta.border}`,
                          borderRadius: 4,
                          boxShadow: isSelected ? `0 0 0 2px ${meta.border}` : 'none',
                        }}
                        onClick={e => { e.stopPropagation(); if (mode === 'select') setSelectedId(z.id) }}
                      >
                        {/* Label */}
                        {labelsVisible && (
                          <div
                            className="absolute top-1 left-1 flex items-center gap-1 rounded px-1.5 py-0.5"
                            style={{ background: meta.border, maxWidth: 'calc(100% - 8px)' }}
                          >
                            <span className="text-white text-[10px] font-semibold truncate leading-tight">
                              {meta.label}
                            </span>
                          </div>
                        )}

                        {/* Type picker on select */}
                        {isSelected && mode === 'select' && (
                          <div
                            className="absolute bottom-full left-0 mb-1 rounded-lg py-1 z-20 animate-slide-down flex gap-0.5"
                            style={{
                              background: 'var(--surface)',
                              border: '1px solid var(--border)',
                              boxShadow: 'var(--shadow-lg)',
                              padding: '4px',
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            {(Object.entries(ZONE_META) as [ZoneType, typeof ZONE_META[ZoneType]][]).map(([type, m]) => (
                              <button
                                key={type}
                                onClick={() => changeZoneType(z.id, type)}
                                className="rounded px-2 py-1 text-[10px] font-semibold transition-colors"
                                style={
                                  z.type === type
                                    ? { background: m.bg, color: m.color }
                                    : { color: 'var(--fg-muted)' }
                                }
                                onMouseEnter={e => { if (z.type !== type) (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)' }}
                                onMouseLeave={e => { if (z.type !== type) (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                              >
                                {m.label}
                              </button>
                            ))}
                            <button
                              onClick={() => deleteZone(z.id)}
                              className="rounded px-2 py-1 transition-colors"
                              style={{ color: '#f43f5e' }}
                              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff1f2' }}
                              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {/* Active draw rectangle */}
                  {drawRect && (
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        ...drawRect,
                        background: ZONE_META[drawType].bg,
                        border: `2px dashed ${ZONE_META[drawType].border}`,
                        borderRadius: 4,
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Upload hint when image present */}
            {backgroundUrl && (
              <button
                onClick={() => fileRef.current?.click()}
                className="mt-3 text-xs transition-opacity hover:opacity-70"
                style={{ color: 'var(--fg-muted)' }}
              >
                Replace image
              </button>
            )}
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
    </div>
  )
}
