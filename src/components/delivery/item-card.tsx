'use client'

import { formatDate, cn } from '@/lib/utils'
import { DELIVERY_CATEGORY_LABELS, type DeliveryItemDTO, type DeliveryStatus } from '@/types/delivery'

const MOVABLE_STATUSES: { value: DeliveryStatus; label: string }[] = [
  { value: 'NOT_STARTED', label: 'Not Started' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'DELAYED', label: 'Delayed' },
  { value: 'CANCELLED', label: 'Cancelled' },
]

interface ItemCardProps {
  item: DeliveryItemDTO
  onOpen: () => void
  onStatusChange: (status: DeliveryStatus) => void
}

export function ItemCard({ item, onOpen, onStatusChange }: ItemCardProps) {
  const isOverdue = item.status !== 'DELIVERED' && item.status !== 'CANCELLED' && new Date(item.dueDate) < new Date()

  return (
    <div
      className="rounded-lg bg-white p-3.5 cursor-pointer lift-card"
      style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-xs)' }}
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug" style={{ color: 'var(--fg)' }}>
          {item.title}
        </p>
        <span
          className="h-2 w-2 shrink-0 rounded-full mt-1"
          style={{ background: item.client.color }}
          title={item.client.name}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]" style={{ color: 'var(--fg-muted)' }}>
        <span>{DELIVERY_CATEGORY_LABELS[item.category]}</span>
        <span className={cn(isOverdue && 'font-semibold')} style={isOverdue ? { color: 'var(--rose)' } : undefined}>
          {formatDate(item.dueDate)}
        </span>
      </div>

      {item.status === 'DELAYED' && item.delays.length === 0 && (
        <p className="mt-2 text-[11px] font-medium" style={{ color: 'var(--rose)' }}>
          Reason required
        </p>
      )}

      <select
        className="mt-3 w-full rounded-md border px-2 py-1 text-[11px]"
        style={{ borderColor: 'var(--border)', color: 'var(--fg-muted)' }}
        value={item.status}
        onClick={(e) => e.stopPropagation()}
        onChange={(e) => onStatusChange(e.target.value as DeliveryStatus)}
      >
        {MOVABLE_STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </div>
  )
}
