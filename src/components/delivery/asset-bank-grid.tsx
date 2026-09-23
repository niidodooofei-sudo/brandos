'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { DELIVERY_CATEGORY_LABELS, type DeliveryCategory, type DeliveryClientDTO } from '@/types/delivery'

interface AssetBankFile {
  id: string
  fileName: string
  fileUrl: string
  thumbnailUrl: string | null
  uploadedAt: string
  item: { id: string; title: string; category: DeliveryCategory; client: DeliveryClientDTO }
}

export function AssetBankGrid() {
  const [files, setFiles] = useState<AssetBankFile[]>([])
  const [clients, setClients] = useState<DeliveryClientDTO[]>([])
  const [clientId, setClientId] = useState('')
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/delivery/clients').then((r) => r.json()).then((json) => setClients(json.clients ?? []))
  }, [])

  useEffect(() => {
    const params = new URLSearchParams()
    if (clientId) params.set('clientId', clientId)
    if (category) params.set('category', category)
    if (q) params.set('q', q)
    fetch(`/api/delivery/asset-bank?${params}`).then((r) => r.json()).then((json) => setFiles(json.files ?? []))
  }, [clientId, category, q])

  const clientOptions = useMemo(() => clients.map((c) => ({ value: c.id, label: c.name })), [clients])
  const categoryOptions = useMemo(
    () => Object.entries(DELIVERY_CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
    []
  )

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--fg-subtle)' }} />
          <Input className="pl-9" placeholder="Search by item title…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select className="w-auto" placeholder="All clients" options={clientOptions} value={clientId} onChange={(e) => setClientId(e.target.value)} />
        <Select className="w-auto" placeholder="All categories" options={categoryOptions} value={category} onChange={(e) => setCategory(e.target.value)} />
      </div>

      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FileText className="h-8 w-8 mb-3" style={{ color: 'var(--fg-subtle)' }} />
          <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>No delivered files match these filters yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {files.map((f) => (
            <a
              key={f.id}
              href={f.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg overflow-hidden bg-white lift-card"
              style={{ border: '1px solid var(--border)' }}
            >
              <div className="aspect-square flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
                {f.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.thumbnailUrl} alt={f.fileName} className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium truncate" style={{ color: 'var(--fg)' }}>{f.item.title}</p>
                <p className="text-[11px] truncate" style={{ color: 'var(--fg-muted)' }}>{f.item.client.name}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </>
  )
}
