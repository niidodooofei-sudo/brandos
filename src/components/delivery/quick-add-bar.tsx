'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DELIVERY_CATEGORY_LABELS, type DeliveryCategory, type DeliveryClientDTO } from '@/types/delivery'

interface QuickAddBarProps {
  clients: DeliveryClientDTO[]
  onSubmit: (input: { title: string; clientId: string; category: DeliveryCategory; dueDate: string }) => Promise<void>
}

export function QuickAddBar({ clients, onSubmit }: QuickAddBarProps) {
  const [title, setTitle] = useState('')
  const [clientId, setClientId] = useState(clients[0]?.id ?? '')
  const [category, setCategory] = useState<DeliveryCategory>('OTHER')
  const [dueDate, setDueDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = title.trim().length > 0 && clientId && dueDate && !submitting

  const submit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await onSubmit({ title: title.trim(), clientId, category, dueDate })
      setTitle('')
      setDueDate('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl bg-white p-3 mb-5"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
    >
      <Input
        className="flex-1 min-w-[200px]"
        placeholder="What do you owe someone?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
      />
      <Select
        className="w-auto"
        options={clients.map((c) => ({ value: c.id, label: c.name }))}
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <Select
        className="w-auto"
        options={Object.entries(DELIVERY_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        value={category}
        onChange={(e) => setCategory(e.target.value as DeliveryCategory)}
      />
      <input
        type="date"
        className="rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--border)' }}
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
      />
      <Button variant="brand" size="sm" className="gap-1.5" disabled={!canSubmit} onClick={submit}>
        <Plus className="h-4 w-4" /> Add
      </Button>
    </div>
  )
}
