import { NextRequest, NextResponse } from 'next/server'
import { getPriorWeekWindow, getPriorMonthWindow } from '@/lib/delivery/calc'
import { computeDeliveryReport } from '@/lib/delivery/report'
import { sendDeliveryReportEmail } from '@/lib/delivery/mailer'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const period = new URL(request.url).searchParams.get('period')
  if (period !== 'weekly' && period !== 'monthly') {
    return NextResponse.json({ error: 'period must be weekly or monthly' }, { status: 400 })
  }

  const { start, end } = period === 'weekly' ? getPriorWeekWindow() : getPriorMonthWindow()
  const periodType = period === 'weekly' ? 'WEEKLY' : 'MONTHLY'

  const orgs = await db.organization.findMany({
    where: { deliveryItems: { some: {} } },
    select: { id: true },
  })

  const results: { orgId: string; reportId: string; reused: boolean }[] = []

  for (const org of orgs) {
    const existing = await db.deliveryReport.findFirst({
      where: { orgId: org.id, periodType, periodStart: start, periodEnd: end },
    })
    if (existing) {
      results.push({ orgId: org.id, reportId: existing.id, reused: true })
      continue
    }

    const summary = await computeDeliveryReport(org.id, start, end)
    const report = await db.deliveryReport.create({
      data: {
        orgId: org.id,
        periodType,
        periodStart: start,
        periodEnd: end,
        summary: summary as unknown as Prisma.InputJsonValue,
      },
    })

    const reportUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/delivery/reports`
    await sendDeliveryReportEmail(summary, periodType, reportUrl).catch((err) =>
      console.error('Failed to send delivery report email:', err)
    )

    results.push({ orgId: org.id, reportId: report.id, reused: false })
  }

  return NextResponse.json({ period, periodStart: start.toISOString(), periodEnd: end.toISOString(), results })
}
