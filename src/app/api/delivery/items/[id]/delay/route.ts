import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { daysLate } from '@/lib/delivery/calc'
import { db } from '@/lib/db'
import type { DelayReasonCategory } from '@/types/delivery'

const ITEM_INCLUDE = {
  client: true,
  files: { orderBy: { uploadedAt: 'desc' as const } },
  delays: { orderBy: { loggedAt: 'desc' as const } },
}

const VALID_REASONS: DelayReasonCategory[] = [
  'CLIENT_FEEDBACK_PENDING',
  'WAITING_ON_ASSETS',
  'SCOPE_CHANGE',
  'OVERLOADED',
  'TECHNICAL_ISSUE',
  'PERSONAL',
  'OTHER',
]

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  const existing = await db.deliveryItem.findFirst({ where: { id, orgId: scope.orgId } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: { reasonCategory?: string; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const reason = (body.reason ?? '').trim()
  if (!reason) return NextResponse.json({ error: 'reason is required' }, { status: 400 })
  if (!body.reasonCategory || !VALID_REASONS.includes(body.reasonCategory as DelayReasonCategory)) {
    return NextResponse.json({ error: 'Invalid reasonCategory' }, { status: 400 })
  }

  await db.delayLog.create({
    data: {
      deliveryItemId: id,
      reasonCategory: body.reasonCategory as DelayReasonCategory,
      reason,
      daysLate: daysLate(existing.dueDate),
    },
  })

  const item = await db.deliveryItem.update({
    where: { id },
    data: { status: 'DELAYED' },
    include: ITEM_INCLUDE,
  })
  return NextResponse.json({ item })
}
