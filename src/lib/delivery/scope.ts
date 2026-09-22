import { db } from '@/lib/db'

/**
 * Resolves the org a Delivery Tracker request should be scoped to: the
 * caller's earliest org membership, matching the pattern already used in
 * src/app/api/brands/route.ts. Returns null if the Clerk user has no
 * BrandOS user/org yet (they haven't been provisioned by visiting an
 * AI-generation page first).
 */
export async function getOrgIdForClerkUser(
  clerkId: string
): Promise<{ userId: string; orgId: string } | null> {
  const user = await db.user.findUnique({ where: { clerkId } })
  if (!user) return null

  const membership = await db.orgMember.findFirst({
    where: { userId: user.id },
    orderBy: { org: { createdAt: 'asc' } },
  })
  if (!membership) return null

  return { userId: user.id, orgId: membership.orgId }
}
