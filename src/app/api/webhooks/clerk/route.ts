import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { db } from '@/lib/db'
import { slugify } from '@/lib/utils'

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  // Verify Svix signature
  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await request.text()

  let payload: { type: string; data: Record<string, unknown> }
  try {
    const wh = new Webhook(WEBHOOK_SECRET)
    payload = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as typeof payload
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { type, data } = payload

  try {
    if (type === 'user.created') {
      const clerkId = data.id as string
      const emailAddresses = data.email_addresses as Array<{ email_address: string }>
      const email = emailAddresses?.[0]?.email_address ?? ''
      const firstName = (data.first_name as string) ?? ''
      const lastName = (data.last_name as string) ?? ''
      const imageUrl = (data.image_url as string) ?? null
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0]

      const user = await db.user.upsert({
        where: { clerkId },
        create: { clerkId, email, name: displayName, avatarUrl: imageUrl },
        update: { email, name: displayName, avatarUrl: imageUrl },
      })

      const orgSlug = `${slugify(displayName)}-${Date.now()}`
      const org = await db.organization.create({
        data: {
          name: `${displayName}'s Workspace`,
          slug: orgSlug,
          ownerId: user.id,
          members: { create: { userId: user.id, role: 'OWNER' } },
        },
      })

      await db.brand.create({
        data: {
          name: `${displayName}'s Brand`,
          slug: `${slugify(displayName)}-brand`,
          orgId: org.id,
          dna: { create: {} },
        },
      })
    }

    if (type === 'user.updated') {
      const clerkId = data.id as string
      const emailAddresses = data.email_addresses as Array<{ email_address: string }>
      const email = emailAddresses?.[0]?.email_address ?? ''
      const firstName = (data.first_name as string) ?? ''
      const lastName = (data.last_name as string) ?? ''
      const imageUrl = (data.image_url as string) ?? null
      const displayName = [firstName, lastName].filter(Boolean).join(' ') || email.split('@')[0]

      await db.user.updateMany({
        where: { clerkId },
        data: { email, name: displayName, avatarUrl: imageUrl },
      })
    }

    if (type === 'user.deleted') {
      const clerkId = data.id as string
      // Cascade deletes handle related records via Prisma schema
      await db.user.deleteMany({ where: { clerkId } })
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
