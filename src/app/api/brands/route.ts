import { NextRequest, NextResponse } from 'next/server'
import { getAuthId } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'
import { brandNameSchema } from '@/lib/validate'

export async function GET(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')

  try {
    const user = await db.user.findUnique({ where: { clerkId: userId } })
    if (!user) return NextResponse.json({ brands: [] })

    const brands = await db.brand.findMany({
      where: orgId
        ? { orgId }
        : { org: { members: { some: { userId: user.id } } } },
      include: { dna: { select: { isComplete: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json({ brands })
  } catch (err) {
    console.error('Brands GET error:', err)
    return NextResponse.json({ brands: [] })
  }
}

export async function POST(request: NextRequest) {
  const userId = await getAuthId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = brandNameSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const { name, orgId } = parsed.data

  try {
    const slug = `${slugify(name)}-${Date.now()}`
    const brand = await db.brand.create({
      data: { name, slug, orgId, dna: { create: {} } },
    })
    return NextResponse.json({ brand }, { status: 201 })
  } catch (err) {
    console.error('Brand create error:', err)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}
