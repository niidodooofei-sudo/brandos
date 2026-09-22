export type DeliveryStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DELIVERED' | 'DELAYED' | 'CANCELLED'
export type DeliveryCategory = 'DESIGN' | 'WEB' | 'PHOTOGRAPHY' | 'VIDEO' | 'CONTENT' | 'BRANDING' | 'OTHER'
export type ClientType = 'FREELANCE' | 'PERSONAL'
export type DelayReasonCategory =
  | 'CLIENT_FEEDBACK_PENDING'
  | 'WAITING_ON_ASSETS'
  | 'SCOPE_CHANGE'
  | 'OVERLOADED'
  | 'TECHNICAL_ISSUE'
  | 'PERSONAL'
  | 'OTHER'
export type ReportPeriod = 'WEEKLY' | 'MONTHLY' | 'CUSTOM'

export interface ChecklistItem {
  text: string
  done: boolean
}

export interface DeliveryClientDTO {
  id: string
  name: string
  type: ClientType
  color: string
  isActive: boolean
}

export interface DeliveryFileDTO {
  id: string
  fileName: string
  fileUrl: string
  fileType: string | null
  thumbnailUrl: string | null
  uploadedAt: string
}

export interface DelayLogDTO {
  id: string
  reasonCategory: DelayReasonCategory
  reason: string
  daysLate: number
  loggedAt: string
  resolvedAt: string | null
}

export interface DeliveryItemDTO {
  id: string
  title: string
  description: string | null
  category: DeliveryCategory
  status: DeliveryStatus
  dueDate: string
  deliveredAt: string | null
  checklist: ChecklistItem[] | null
  client: DeliveryClientDTO
  files: DeliveryFileDTO[]
  delays: DelayLogDTO[]
}

export const DELIVERY_CATEGORY_LABELS: Record<DeliveryCategory, string> = {
  DESIGN: 'Design',
  WEB: 'Web',
  PHOTOGRAPHY: 'Photography',
  VIDEO: 'Video',
  CONTENT: 'Content',
  BRANDING: 'Branding',
  OTHER: 'Other',
}

export const DELAY_REASON_LABELS: Record<DelayReasonCategory, string> = {
  CLIENT_FEEDBACK_PENDING: 'Waiting on client feedback',
  WAITING_ON_ASSETS: 'Waiting on assets',
  SCOPE_CHANGE: 'Scope change',
  OVERLOADED: 'Overloaded',
  TECHNICAL_ISSUE: 'Technical issue',
  PERSONAL: 'Personal',
  OTHER: 'Other',
}
