import nodemailer from 'nodemailer'
import type { DeliveryReportSummary } from './report'

export async function sendDeliveryReportEmail(
  summary: DeliveryReportSummary,
  periodType: 'WEEKLY' | 'MONTHLY',
  reportUrl: string
): Promise<void> {
  if (!process.env.SMTP_HOST) {
    console.warn('SMTP_HOST not configured — skipping delivery report email')
    return
  }

  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  })

  const label = periodType === 'WEEKLY' ? 'Weekly' : 'Monthly'
  const subject = `${label} Delivery Report — ${summary.onTimeRate}% on-time`

  const html = `
    <h2>${label} Delivery Report</h2>
    <p>${summary.periodStart.slice(0, 10)} – ${summary.periodEnd.slice(0, 10)}</p>
    <p><strong>${summary.delivered.length}</strong> delivered, <strong>${summary.delayed.length}</strong> delayed,
       <strong>${summary.onTimeRate}%</strong> on-time (${summary.onTimeCount}/${summary.totalDueCount} due).</p>
    <p><a href="${reportUrl}">View full report</a></p>
  `

  await transport.sendMail({
    from: process.env.SMTP_FROM,
    to: process.env.DELIVERY_REPORT_EMAIL_TO ?? 'niidodooofei@gmail.com',
    subject,
    html,
  })
}
