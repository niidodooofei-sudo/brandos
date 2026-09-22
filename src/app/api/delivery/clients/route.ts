import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { getOrgIdForClerkUser } from '@/lib/delivery/scope'
import { db } from '@/lib/db'

export async function GET() {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ clients: [] })

  const clients = await db.deliveryClient.findMany({
    where: { orgId: scope.orgId, isActive: true },
    orderBy: { name: 'asc' },
  })
  return NextResponse.json({ clients })
}

export async function POST(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const scope = await getOrgIdForClerkUser(clerkId)
  if (!scope) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

  let body: { name?: string; type?: string; color?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const name = (body.name ?? '').trim()
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const client = await db.deliveryClient.create({
    data: {
      orgId: scope.orgId,
      name,
      type: body.type === 'PERSONAL' ? 'PERSONAL' : 'FREELANCE',
      color: body.color ?? '#8b5cf6',
    },
  })
  return NextResponse.json({ client }, { status: 201 })
}
