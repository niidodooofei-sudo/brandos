import { db } from '@/lib/db'
import { isOverdue } from './calc'

/**
 * Runs on every board load (per design spec §Build Order step 6: "lightweight
 * query on page load, doesn't need BullMQ on day one"). Flips any open item
 * whose dueDate has passed to DELAYED. Does NOT create a DelayLog — the UI
 * requires the user to file a reason before the item can move again; a
 * DELAYED item with no DelayLog rows is exactly "reason pending".
 */
export async function flipOverdueItemsToDelayed(orgId: string): Promise<number> {
  const now = new Date()
  const candidates = await db.deliveryItem.findMany({
    where: {
      orgId,
      status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
    },
    select: { id: true, dueDate: true },
  })

  const overdueIds = candidates.filter((c) => isOverdue(c.dueDate, now)).map((c) => c.id)
  if (overdueIds.length === 0) return 0

  await db.deliveryItem.updateMany({
    where: { id: { in: overdueIds } },
    data: { status: 'DELAYED' },
  })
  return overdueIds.length
}
