import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { computeDeliveryReport } from '@/lib/delivery/report'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET() {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ reports: [] })

  const reports = await db.deliveryReport.findMany({
    where: { orgId: scope.orgId },
    orderBy: { generatedAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ reports })
}

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  let body: { periodStart?: string; periodEnd?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.periodStart || !body.periodEnd) {
    return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 })
  }

  const periodStart = new Date(body.periodStart)
  const periodEnd = new Date(body.periodEnd)
  const summary = await computeDeliveryReport(scope.orgId, periodStart, periodEnd)

  const report = await db.deliveryReport.create({
    data: {
      orgId: scope.orgId,
      periodType: 'CUSTOM',
      periodStart,
      periodEnd,
      summary: summary as unknown as Prisma.InputJsonValue,
    },
  })
  return NextResponse.json({ report }, { status: 201 })
}
