'use client'

import { useCallback, useEffect, useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { ItemCard } from './item-card'
import { QuickAddBar } from './quick-add-bar'
import { ItemDrawer } from './item-drawer'
import type { DeliveryCategory, DeliveryClientDTO, DeliveryItemDTO, DeliveryStatus } from '@/types/delivery'

const COLUMNS: { status: DeliveryStatus; label: string }[] = [
  { status: 'NOT_STARTED', label: 'Not Started' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'DELAYED', label: 'Delayed' },
]

export function Board() {
  const [items, setItems] = useState<DeliveryItemDTO[]>([])
  const [clients, setClients] = useState<DeliveryClientDTO[]>([])
  const [loading, setLoading] = useState(true)
  const [openItemId, setOpenItemId] = useState<string | null>(null)
  const [pendingStatus, setPendingStatus] = useState<DeliveryStatus | null>(null)

  const load = useCallback(async () => {
    const [itemsRes, clientsRes] = await Promise.all([
      fetch('/api/delivery/items').then((r) => r.json()),
      fetch('/api/delivery/clients').then((r) => r.json()),
    ])
    setItems(itemsRes.items ?? [])
    setClients(clientsRes.clients ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const createItem = async (input: { title: string; clientId: string; category: DeliveryCategory; dueDate: string }) => {
    await fetch('/api/delivery/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    await load()
  }

  const changeStatus = async (id: string, status: DeliveryStatus) => {
    if (status === 'DELIVERED' || status === 'DELAYED') {
      if (status === 'DELAYED') {
        setPendingStatus('DELAYED')
      }
      setOpenItemId(id)
      return
    }
    await fetch(`/api/delivery/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    await load()
  }

  if (loading) return null

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-center">
        <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-muted)' }}>
          <PackageCheck className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--fg)' }}>No clients yet</p>
        <p className="text-sm max-w-sm" style={{ color: 'var(--fg-muted)' }}>
          Add a client via the API or seed script before logging your first deliverable.
        </p>
      </div>
    )
  }

  return (
    <>
      <QuickAddBar clients={clients} onSubmit={createItem} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const columnItems = items.filter((i) => i.status === col.status)
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-2.5 px-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--fg-muted)' }}>
                  {col.label}
                </p>
                <span className="text-xs" style={{ color: 'var(--fg-subtle)' }}>{columnItems.length}</span>
              </div>
              <div className="space-y-2.5">
                {columnItems.map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onOpen={() => setOpenItemId(item.id)}
                    onStatusChange={(status) => changeStatus(item.id, status)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {openItemId && (
        <ItemDrawer
          itemId={openItemId}
          pendingStatus={pendingStatus}
          onClose={() => {
            setOpenItemId(null)
            setPendingStatus(null)
          }}
          onChanged={load}
        />
      )}
    </>
  )
}
