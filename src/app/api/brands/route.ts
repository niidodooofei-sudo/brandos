import { NextRequest, NextResponse } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { getAuthId } from '@/lib/auth-helper'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'

// Auto-provision a User → Org → default Brand if none exist for this Clerk user.
async function ensureUser(clerkId: string) {
  let user = await db.user.findUnique({ where: { clerkId } })
  if (user) return user

  const clerkUser = await currentUser()
  const email = clerkUser?.emailAddresses[0]?.emailAddress ?? `${clerkId}@placeholder.dev`
  const displayName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(' ') ||
    email.split('@')[0] ||
    'User'

  user = await db.user.create({ data: { clerkId, email, name: displayName } })

  const org = await db.organization.create({
    data: {
      name: `${displayName}'s Workspace`,
      slug: `${slugify(displayName)}-${Date.now()}`,
      ownerId: user.id,
      members: { create: { userId: user.id, role: 'OWNER' } },
    },
  })

  await db.brand.create({
    data: {
      name: 'My Brand',
      slug: `my-brand-${Date.now()}`,
      orgId: org.id,
      dna: { create: {} },
    },
  })

  return user
}

export async function GET() {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ brands: [] })

  try {
    const user = await ensureUser(clerkId)
    const brands = await db.brand.findMany({
      where: { org: { members: { some: { userId: user.id } } } },
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
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let name: string
  try {
    const body = await request.json()
    name = (body.name ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  try {
    const user = await ensureUser(clerkId)
    const membership = await db.orgMember.findFirst({
      where: { userId: user.id },
      orderBy: { org: { createdAt: 'asc' } },
    })
    if (!membership) return NextResponse.json({ error: 'No workspace found' }, { status: 404 })

    const brand = await db.brand.create({
      data: {
        name,
        slug: `${slugify(name)}-${Date.now()}`,
        orgId: membership.orgId,
        dna: { create: {} },
      },
      include: { dna: { select: { isComplete: true } } },
    })
    return NextResponse.json({ brand }, { status: 201 })
  } catch (err) {
    console.error('Brand create error:', err)
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const clerkId = await getAuthId()
  if (!clerkId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const brandId = searchParams.get('brandId')
  if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 })

  try {
    const user = await db.user.findUnique({ where: { clerkId } })
    if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Ensure the brand belongs to one of the user's orgs
    const brand = await db.brand.findFirst({
      where: { id: brandId, org: { members: { some: { userId: user.id } } } },
    })
    if (!brand) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.brand.delete({ where: { id: brandId } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Brand delete error:', err)
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 })
  }
}
