import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { flipOverdueItemsToDelayed } from '@/lib/delivery/auto-delay'
import { normalizeDueDateEndOfDay } from '@/lib/delivery/calc'
import { db } from '@/lib/db'
import type { DeliveryCategory } from '@/types/delivery'

const ITEM_INCLUDE = {
  client: true,
  files: { orderBy: { uploadedAt: 'desc' as const } },
  delays: { orderBy: { loggedAt: 'desc' as const } },
}

export async function GET() {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ items: [] })

  await flipOverdueItemsToDelayed(scope.orgId)

  const items = await db.deliveryItem.findMany({
    where: { orgId: scope.orgId },
    include: ITEM_INCLUDE,
    orderBy: { dueDate: 'asc' },
  })
  return NextResponse.json({ items })
}

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  let body: { title?: string; clientId?: string; category?: DeliveryCategory; dueDate?: string; description?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const title = (body.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!body.clientId) return NextResponse.json({ error: 'clientId is required' }, { status: 400 })
  if (!body.dueDate) return NextResponse.json({ error: 'dueDate is required' }, { status: 400 })

  const client = await db.deliveryClient.findFirst({ where: { id: body.clientId, orgId: scope.orgId } })
  if (!client) return NextResponse.json({ error: 'Unknown client' }, { status: 400 })

  const item = await db.deliveryItem.create({
    data: {
      orgId: scope.orgId,
      clientId: body.clientId,
      createdById: scope.userId,
      title,
      description: body.description?.trim() || null,
      category: body.category ?? 'OTHER',
      dueDate: normalizeDueDateEndOfDay(body.dueDate),
    },
    include: ITEM_INCLUDE,
  })
  return NextResponse.json({ item }, { status: 201 })
}
