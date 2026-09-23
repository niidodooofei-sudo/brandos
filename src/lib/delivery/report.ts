import { db } from '@/lib/db'
import { calculateOnTimeRate } from './calc'

export interface DeliveryReportSummary {
  periodStart: string
  periodEnd: string
  onTimeCount: number
  totalDueCount: number
  onTimeRate: number
  delivered: {
    id: string
    title: string
    clientName: string
    deliveredAt: string
    fileUrls: string[]
  }[]
  delayed: {
    id: string
    title: string
    clientName: string
    reasonCategory: string
    reason: string
    daysLate: number
  }[]
}

/**
 * "What was owed" = items due in the window (by dueDate), used for the
 * on-time rate denominator. "What got done" = items delivered in the window
 * (by deliveredAt) — these can differ, e.g. an item due last week but
 * delivered this week counts as owed-last-week, delivered-this-week.
 * Matches design spec §Automated Weekly/Monthly Reports.
 */
export async function computeDeliveryReport(
  orgId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<DeliveryReportSummary> {
  const [itemsDue, deliveredItems, delayLogs] = await Promise.all([
    db.deliveryItem.findMany({
      where: { orgId, dueDate: { gte: periodStart, lte: periodEnd } },
      select: { id: true, dueDate: true, deliveredAt: true },
    }),
    db.deliveryItem.findMany({
      where: { orgId, deliveredAt: { gte: periodStart, lte: periodEnd } },
      include: { client: true, files: true },
    }),
    db.delayLog.findMany({
      where: { item: { orgId }, loggedAt: { gte: periodStart, lte: periodEnd } },
      include: { item: { include: { client: true } } },
    }),
  ])

  const onTimeCount = itemsDue.filter((i) => i.deliveredAt && i.deliveredAt <= i.dueDate).length
  const totalDueCount = itemsDue.length

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    onTimeCount,
    totalDueCount,
    onTimeRate: calculateOnTimeRate(onTimeCount, totalDueCount),
    delivered: deliveredItems.map((i) => ({
      id: i.id,
      title: i.title,
      clientName: i.client.name,
      deliveredAt: i.deliveredAt!.toISOString(),
      fileUrls: i.files.map((f) => f.fileUrl),
    })),
    delayed: delayLogs.map((d) => ({
      id: d.item.id,
      title: d.item.title,
      clientName: d.item.client.name,
      reasonCategory: d.reasonCategory,
      reason: d.reason,
      daysLate: d.daysLate,
    })),
  }
}
