'use client'

import { DELAY_REASON_LABELS, type DelayReasonCategory } from '@/types/delivery'
import type { DeliveryReportSummary } from '@/lib/delivery/report'
import { Badge } from '@/components/ui/badge'

interface ReportRecord {
  id: string
  periodType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  generatedAt: string
  summary: DeliveryReportSummary
}

export function ReportView({ report }: { report: ReportRecord }) {
  const { summary } = report
  return (
    <div className="rounded-xl bg-white p-5" style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <Badge variant={report.periodType === 'CUSTOM' ? 'secondary' : 'brand'}>{report.periodType}</Badge>
          <p className="text-sm mt-1" style={{ color: 'var(--fg-muted)' }}>
            {summary.periodStart.slice(0, 10)} – {summary.periodEnd.slice(0, 10)}
          </p>
        </div>
        <p className="text-2xl font-bold" style={{ color: summary.onTimeRate >= 80 ? 'var(--emerald)' : 'var(--rose)' }}>
          {summary.onTimeRate}%
        </p>
      </div>

      <p className="text-sm mb-3" style={{ color: 'var(--fg-muted)' }}>
        {summary.onTimeCount}/{summary.totalDueCount} due items delivered on time ·{' '}
        {summary.delivered.length} delivered · {summary.delayed.length} delayed
      </p>

      {summary.delayed.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--fg-muted)' }}>Delayed</p>
          <ul className="space-y-1 text-sm">
            {summary.delayed.map((d) => (
              <li key={d.id} style={{ color: 'var(--fg)' }}>
                <strong>{d.title}</strong> ({d.clientName}) — {DELAY_REASON_LABELS[d.reasonCategory as DelayReasonCategory]}, {d.daysLate}d late
              </li>
            ))}
          </ul>
        </div>
      )}

      {summary.delivered.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--fg-muted)' }}>Delivered</p>
          <ul className="space-y-1 text-sm">
            {summary.delivered.map((d) => (
              <li key={d.id} style={{ color: 'var(--fg)' }}>
                <strong>{d.title}</strong> ({d.clientName}){' '}
                {d.fileUrls.map((url, i) => (
                  <a key={url} href={url} target="_blank" rel="noreferrer" className="underline ml-1" style={{ color: 'var(--brand)' }}>
                    file{d.fileUrls.length > 1 ? ` ${i + 1}` : ''}
                  </a>
                ))}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
