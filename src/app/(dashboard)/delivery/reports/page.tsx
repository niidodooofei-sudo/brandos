'use client'

import { useEffect, useState } from 'react'
import { ReportView } from '@/components/delivery/report-view'
import { Button } from '@/components/ui/button'

interface ReportRecord {
  id: string
  periodType: 'WEEKLY' | 'MONTHLY' | 'CUSTOM'
  generatedAt: string
  summary: import('@/lib/delivery/report').DeliveryReportSummary
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRecord[]>([])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [generating, setGenerating] = useState(false)

  const load = () => fetch('/api/delivery/reports').then((r) => r.json()).then((json) => setReports(json.reports ?? []))

  useEffect(() => {
    load()
  }, [])

  const generateNow = async () => {
    if (!from || !to) return
    setGenerating(true)
    try {
      await fetch('/api/delivery/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: from, periodEnd: to }),
      })
      await load()
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-[900px] animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Reports</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>
          Weekly and monthly delivery snapshots, plus ad-hoc custom ranges.
        </p>
      </div>

      <div
        className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 mb-6"
        style={{ border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
      >
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>From</label>
          <input type="date" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--fg-muted)' }}>To</label>
          <input type="date" className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: 'var(--border)' }} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button variant="brand" size="sm" disabled={generating || !from || !to} onClick={generateNow}>
          Generate now
        </Button>
      </div>

      {reports.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--fg-muted)' }}>No reports yet.</p>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <ReportView key={r.id} report={r} />
          ))}
        </div>
      )}
    </div>
  )
}
