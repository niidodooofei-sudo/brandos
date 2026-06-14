import { BarChart2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  return (
    <div className="max-w-[1200px] animate-fade-up">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--fg)' }}>Analytics</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--fg-muted)' }}>Brand performance and asset insights.</p>
      </div>

      {/* Empty state — data appears once assets exist */}
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div
          className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface-muted)' }}
        >
          <BarChart2 className="h-8 w-8" style={{ color: 'var(--fg-subtle)' }} />
        </div>
        <p className="text-base font-semibold mb-1" style={{ color: 'var(--fg)' }}>No data yet</p>
        <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--fg-muted)' }}>
          Analytics will appear here once you start generating assets. Brand compliance scores, output volume, and team activity are tracked automatically.
        </p>
        <Link href="/create">
          <Button variant="brand">Generate your first asset</Button>
        </Link>
      </div>
    </div>
  )
}
