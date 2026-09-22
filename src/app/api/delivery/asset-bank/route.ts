// src/app/api/delivery/asset-bank/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { db } from '@/lib/db'
import type { Prisma, DeliveryCategory as PrismaDeliveryCategory } from '@prisma/client'

export async function GET(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ files: [] })

  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('clientId')
  const category = searchParams.get('category')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const q = searchParams.get('q')

  const itemWhere: Prisma.DeliveryItemWhereInput = { orgId: scope.orgId }
  if (clientId) itemWhere.clientId = clientId
  if (category) itemWhere.category = category as PrismaDeliveryCategory
  if (q) itemWhere.title = { contains: q, mode: 'insensitive' }

  const uploadedAt: Prisma.DateTimeFilter = {}
  if (from) uploadedAt.gte = new Date(from)
  if (to) uploadedAt.lte = new Date(to)

  const files = await db.deliveryFile.findMany({
    where: {
      item: itemWhere,
      ...(from || to ? { uploadedAt } : {}),
    },
    include: {
      item: { select: { id: true, title: true, category: true, client: true } },
    },
    orderBy: { uploadedAt: 'desc' },
    take: 200,
  })

  return NextResponse.json({ files })
}
