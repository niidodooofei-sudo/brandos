'use client'

import { useEffect, useState } from 'react'
import { Upload, Check, Plus, X } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DELAY_REASON_LABELS,
  DELIVERY_CATEGORY_LABELS,
  type ChecklistItem,
  type DelayReasonCategory,
  type DeliveryItemDTO,
} from '@/types/delivery'

interface ItemDrawerProps {
  itemId: string
  onClose: () => void
  onChanged: () => void
}

export function ItemDrawer({ itemId, onClose, onChanged }: ItemDrawerProps) {
  const [item, setItem] = useState<DeliveryItemDTO | null>(null)
  const [newChecklistText, setNewChecklistText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [reasonCategory, setReasonCategory] = useState<DelayReasonCategory>('OTHER')
  const [reasonText, setReasonText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const res = await fetch('/api/delivery/items').then((r) => r.json())
    const items = Array.isArray(res.items) ? (res.items as DeliveryItemDTO[]) : []
    const found = items.find((i) => i.id === itemId)
    setItem(found ?? null)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId])

  if (!item) return null

  const needsReason = item.status === 'DELAYED' && item.delays.length === 0

  const toggleChecklistItem = async (index: number) => {
    const checklist = [...(item.checklist ?? [])]
    checklist[index] = { ...checklist[index], done: !checklist[index].done }
    await patch({ checklist })
  }

  const addChecklistItem = async () => {
    const text = newChecklistText.trim()
    if (!text) return
    const checklist: ChecklistItem[] = [...(item.checklist ?? []), { text, done: false }]
    setNewChecklistText('')
    await patch({ checklist })
  }

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/delivery/items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      return
    }
    setError(null)
    setItem(json.item)
    onChanged()
  }

  const handleUploadAndDeliver = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const form = new FormData()
        form.append('file', file)
        form.append('deliveryItemId', itemId)
        const res = await fetch('/api/delivery/files', { method: 'POST', body: form })
        if (!res.ok) {
          const json = await res.json()
          throw new Error(json.error ?? 'Upload failed')
        }
      }
      await patch({ status: 'DELIVERED' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const submitDelayReason = async () => {
    const reason = reasonText.trim()
    if (!reason) return
    const res = await fetch(`/api/delivery/items/${itemId}/delay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reasonCategory, reason }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? 'Something went wrong')
      return
    }
    setError(null)
    setReasonText('')
    setItem(json.item)
    onChanged()
  }

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{item.title}</SheetTitle>
          <div className="mt-1.5 flex items-center gap-2">
            <Badge variant="brand">{item.client.name}</Badge>
            <Badge variant="secondary">{DELIVERY_CATEGORY_LABELS[item.category]}</Badge>
          </div>
        </SheetHeader>

        {error && (
          <div className="mb-4 rounded-lg px-3 py-2 text-xs" style={{ background: '#fef2f2', color: '#b91c1c' }}>
            {error}
          </div>
        )}

        <Textarea
          label="Description"
          placeholder="Optional details"
          defaultValue={item.description ?? ''}
          onBlur={(e) => patch({ description: e.target.value })}
        />

        <div className="mt-5">
          <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>Checklist</p>
          <div className="space-y-1.5">
            {(item.checklist ?? []).map((c, i) => (
              <button
                key={i}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-[var(--surface-muted)]"
                onClick={() => toggleChecklistItem(i)}
              >
                <span
                  className="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  style={{ borderColor: 'var(--border)', background: c.done ? 'var(--brand)' : 'transparent' }}
                >
                  {c.done && <Check className="h-3 w-3 text-white" />}
                </span>
                <span style={c.done ? { textDecoration: 'line-through', color: 'var(--fg-subtle)' } : undefined}>
                  {c.text}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              className="flex-1 rounded-lg border px-2.5 py-1.5 text-sm"
              style={{ borderColor: 'var(--border)' }}
              placeholder="e.g. Draft sent"
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
            />
            <Button variant="outline" size="sm" onClick={addChecklistItem}><Plus className="h-3.5 w-3.5" /></Button>
          </div>
        </div>

        {needsReason && (
          <div className="mt-5 rounded-lg p-3.5" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="text-sm font-semibold mb-2" style={{ color: '#b91c1c' }}>This item is overdue — a reason is required</p>
            <Select
              className="mb-2"
              options={Object.entries(DELAY_REASON_LABELS).map(([value, label]) => ({ value, label }))}
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value as DelayReasonCategory)}
            />
            <Textarea
              placeholder="What happened?"
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />
            <Button variant="destructive" size="sm" className="mt-2" onClick={submitDelayReason}>
              Log delay reason
            </Button>
          </div>
        )}

        {item.status === 'DELAYED' && item.delays.length > 0 && (
          <div className="mt-5">
            <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>Delay reason</p>
            <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
              {DELAY_REASON_LABELS[item.delays[0].reasonCategory]} — {item.delays[0].reason}
            </p>
          </div>
        )}

        <div className="mt-5">
          <p className="text-sm font-medium mb-1.5" style={{ color: 'var(--fg)' }}>Proof of delivery</p>
          {item.files.length > 0 && (
            <div className="mb-2 space-y-1.5">
              {item.files.map((f) => (
                <a
                  key={f.id}
                  href={f.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-sm underline"
                  style={{ color: 'var(--brand)' }}
                >
                  {f.fileName}
                </a>
              ))}
            </div>
          )}
          {item.status !== 'DELIVERED' && (
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 cursor-pointer transition-colors hover:bg-[var(--surface-muted)]"
              style={{ borderColor: 'var(--border)' }}
            >
              <input type="file" multiple className="sr-only" onChange={(e) => handleUploadAndDeliver(e.target.files)} />
              <Upload className="h-5 w-5" style={{ color: 'var(--fg-subtle)' }} />
              <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>
                {uploading ? 'Uploading…' : 'Attach file(s) to mark Delivered'}
              </p>
            </label>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
