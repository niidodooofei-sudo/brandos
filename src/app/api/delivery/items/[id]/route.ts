import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { db } from '@/lib/db'
import type { ChecklistItem, DeliveryStatus } from '@/types/delivery'
import type { Prisma } from '@prisma/client'

const ITEM_INCLUDE = {
  client: true,
  files: { orderBy: { uploadedAt: 'desc' as const } },
  delays: { orderBy: { loggedAt: 'desc' as const } },
}

const VALID_STATUSES: DeliveryStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'DELIVERED', 'DELAYED', 'CANCELLED']

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const existing = await db.deliveryItem.findFirst({
    where: { id, orgId: scope.orgId },
    include: { files: true },
  })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { status?: string; description?: string; checklist?: ChecklistItem[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data: {
    status?: DeliveryStatus
    deliveredAt?: Date | null
    description?: string | null
    checklist?: Prisma.InputJsonValue
  } = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as DeliveryStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    if (body.status === 'DELIVERED' && existing.files.length === 0) {
      return NextResponse.json(
        { error: 'Attach at least one file before marking this item Delivered' },
        { status: 400 }
      )
    }
    data.status = body.status as DeliveryStatus
    data.deliveredAt = body.status === 'DELIVERED' ? new Date() : null
  }

  if (body.description !== undefined) data.description = body.description.trim() || null
  if (body.checklist !== undefined) data.checklist = body.checklist as unknown as Prisma.InputJsonValue

  const item = await db.deliveryItem.update({
    where: { id },
    data,
    include: ITEM_INCLUDE,
  })
  return NextResponse.json({ item })
}
